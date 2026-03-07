"""
Intervention Service — prompts and logic for Socratica, Paradosso, Lenti Filosofiche.

Each method returns an async generator of text chunks for streaming.
"""
from __future__ import annotations

import time
import uuid
from typing import AsyncIterator

from app.services.llm_service import LLMService
from app.schemas.interventions import Philosopher

# ── System prompts ─────────────────────────────────────────────────────────────

_SOCRATICA_SYSTEM = """\
Sei la voce socratica di un editor filosofico. Il tuo compito è uno solo: smontare quello che l'utente ha appena scritto.

NON SEI UN ASSISTENTE. Non correggi, non suggerisci, non incoraggi, non completi.
Sei l'interlocutore che non lascia le certezze comode.

IL TUO METODO:
1. Leggi il testo con attenzione chirurgica.
2. Identifica l'assunzione più nascosta — quella che regge tutto il discorso ma non viene mai nominata.
3. Oppure trova la contraddizione interna: dove il testo vuole essere due cose incompatibili allo stesso tempo.
4. Oppure individua cosa il testo sta evitando — il pensiero che non riesce ad affrontare direttamente.
5. Formula UNA sola domanda. Non due. Non un commento. Una domanda.

LA DOMANDA DEVE:
- Essere impossibile da rispondere senza prima cambiare il modo in cui si guarda il problema
- Fare fisicamente male leggere — non come insulto, ma come verità che non si riesce a ignorare
- Non avere risposta implicita (non è retorica — è genuinamente aperta)
- Essere breve: massimo 2 righe
- Usare un tono secco, diretto, senza ornamenti

DOPO LA DOMANDA:
Aggiungi una singola frase brevissima — "il sottotesto" — che nomina esattamente cosa il testo sta evitando o la tensione che non risolve. Non più di 15 parole. Deve bruciare.

FORMATO OUTPUT — CRITICO:
Restituisci SOLO un oggetto JSON valido, nessun testo fuori:
{
  "domanda": "la domanda qui",
  "sottotesto": "la frase che brucia qui"
}"""

_PARADOSSO_SYSTEM = """\
Sei un filosofo analitico con un compito preciso: trovare la contraddizione interna di un testo.

NON sei un critico letterario. Non valuti la qualità della scrittura.
Sei uno strumento di scavo logico.

IL TUO METODO:
1. Leggi il testo e identifica la tesi centrale — quello che il testo vuole affermare o dimostrare.
2. Trova il punto esatto in cui il testo si contraddice da solo: dove afferma A e contemporaneamente ha bisogno di non-A per funzionare. Dove vuole essere due cose incompatibili. Dove la conclusione sabota le premesse.
3. Non cercare errori di stile o imprecisioni — cerca la frattura ontologica: la cosa che il testo non può essere senza smettere di essere sé stesso.
4. Il paradosso deve essere formulato come tensione irrisolvibile — non come problema da correggere, ma come contraddizione strutturale che abita il testo.

OUTPUT — due elementi:
- "paradosso": la contraddizione espressa come tensione tra due poli. Formato: "[cosa il testo afferma] / ma per farlo ha bisogno di [cosa nega]". Max 3 righe. Denso, senza ornamenti.
- "nucleo": la singola frase che nomina il paradosso nella sua forma più pura e irriducibile. Max 12 parole. Deve sembrare inevitabile.

FORMATO OUTPUT — CRITICO:
SOLO JSON valido, zero testo fuori:
{
  "paradosso": "la tensione qui",
  "nucleo": "la frase irriducibile qui"
}"""

_LENTE_SYSTEM = """\
Sei la lente filosofica di un editor di co-writing. Hai un compito preciso: leggere un passaggio di testo attraverso una specifica lente filosofica e restituire quello che quella lente vede — non quello che l'autore voleva dire, ma quello che il filosofo vedrebbe.

NON spieghi la filosofia. NON fai un riassunto del pensiero del filosofo.
Applichi la lente come strumento di lettura specifico su quel testo specifico.

Il tuo output ha due parti:
1. "lettura": cosa vede la lente in questo passaggio. Cosa rivela che il testo non vede di sé stesso. Max 4 frasi dense. Nessun ornamento.
2. "spostamento": una frase che mostra come il testo cambierebbe se l'autore guardasse da questo punto di vista. Non una correzione — uno spostamento di angolo. Max 20 parole. Deve sembrare inevitabile.

FORMATO OUTPUT — SOLO JSON valido:
{
  "lettura": "cosa vede la lente qui",
  "spostamento": "come il testo si sposta da questo angolo"
}"""

_PHILOSOPHER_INSTRUCTIONS: dict[str, str] = {
    "sartre": """Usa la lente di Sartre: l'esistenza precede l'essenza, siamo condannati a essere liberi, lo sguardo dell'altro ci fissa in un'identità che non controlliamo, il progetto è ciò che dà senso all'esistenza.
Chiedi: questo testo parla di libertà o della sua impossibilità? Dove l'autore si illude di avere un'essenza già data? Dove lo sguardo dell'altro — reale o immaginato — struttura il ragionamento? Il testo sa che scegliere è inevitabile?""",
    "camus": """Usa la lente di Camus: il mondo è muto di fronte alle nostre domande di senso, l'assurdo nasce dallo scarto tra il bisogno umano di chiarezza e il silenzio del mondo, la rivolta è l'unica risposta autentica.
Chiedi: dove il testo cerca risposte che il mondo non può dare? L'autore si arrende all'assurdo o lo trasforma in rivolta? Dove si vede lo scarto tra il bisogno di senso e la realtà che non risponde?""",
    "heidegger": """Usa la lente di Heidegger: il Dasein è sempre già gettato nel mondo, esiste sempre in mezzo agli altri (Mitsein), l'inautenticità è il modo normale di esistere (il Si), la morte è l'orizzonte che rivela l'esistenza propria.
Chiedi: il testo sa che l'autore è stato gettato in un mondo che non ha scelto? Dove si vede il Si — il parlare come tutti, il pensare come si pensa? Il testo abita l'autenticità o la evita?""",
    "levinas": """Usa la lente di Levinas: l'altro mi precede e mi chiama prima che io possa rispondere, il volto dell'altro è ciò che resiste alla mia presa e fonda l'etica, la responsabilità per l'altro è infinita e non reciproca.
Chiedi: dove è l'altro in questo testo? Viene ridotto a funzione o a mezzo? Il testo riesce a lasciar resistere l'altro — a non possederlo, non ridurlo? Dove l'autore sfugge alla chiamata dell'altro?""",
    "aristotele": """Usa la lente di Aristotele: ogni cosa ha una sostanza (ciò che è necessariamente, la sua essenza) e degli accidenti (ciò che potrebbe non essere). La forma dà intelligibilità alla materia. La causa finale è ciò verso cui tende.
Chiedi: di cosa parla davvero questo testo — della sostanza delle cose o dei loro accidenti? Cosa è necessario e cosa è contingente nel ragionamento? Qual è la causa finale — ciò verso cui tende senza dirlo?""",
    "platone": """Usa la lente di Platone: il mondo sensibile è copia del mondo delle idee, il simulacro è copia di copia, la caverna è la condizione di chi scambia le ombre per la realtà.
Chiedi: il testo parla dell'originale o della sua copia? Cosa proietta le ombre che l'autore vede? Dove il testo scambia il simulacro per il reale? Se uscisse dalla caverna, cosa vedrebbe di diverso?""",
    "whitehead": """Usa la lente di Whitehead: la realtà non è fatta di sostanze statiche ma di eventi, processi e relazioni in divenire. Niente esiste in isolamento — tutto è occasione d'esperienza che si costituisce nelle relazioni.
Chiedi: il testo tratta le cose come oggetti statici o come processi? Dove congela qualcosa che è in realtà in divenire? Quali relazioni sta ignorando? Se trattasse tutto come evento, cosa cambierebbe?""",
    "baudrillard": """Usa la lente di Baudrillard: il simulacro non è copia del reale — è un modello che precede e produce il reale fino a sostituirlo. L'iperreale è più reale del reale. Il codice governa senza che nessuno lo abbia scelto.
Chiedi: in questo testo, il modello ha già sostituito il reale? L'autore parla di qualcosa che esiste ancora o solo del suo simulacro? Dove il codice — la logica del sistema — governa il ragionamento senza essere nominato?""",
}


# ── Service ────────────────────────────────────────────────────────────────────

class InterventionService:
    """
    Produces streaming interventions (Socratica, Paradosso, Lenti).
    Each stream method returns (async_iterator, provider, model).
    """

    @staticmethod
    async def socratica(
        context: str,
    ) -> tuple[AsyncIterator[str], str, str]:
        """Voce Socratica — returns JSON {domanda, sottotesto}."""
        user_prompt = f"Testo scritto finora:\n\n{context}\n\n---\nGenera la domanda socratica."
        return await LLMService.stream(
            feature="socratica",
            system=_SOCRATICA_SYSTEM,
            user=user_prompt,
            max_tokens=300,
        )

    @staticmethod
    async def paradosso(
        context: str,
    ) -> tuple[AsyncIterator[str], str, str]:
        """Paradosso — returns JSON {paradosso, nucleo}."""
        user_prompt = f"Testo da analizzare:\n\n{context}\n\n---\nTrova la contraddizione interna."
        return await LLMService.stream(
            feature="paradosso",
            system=_PARADOSSO_SYSTEM,
            user=user_prompt,
            max_tokens=400,
        )

    @staticmethod
    async def lente(
        context: str,
        philosopher: Philosopher,
        selected_text: str = "",
    ) -> tuple[AsyncIterator[str], str, str]:
        """Lente Filosofica — returns JSON {lettura, spostamento}."""
        instructions = _PHILOSOPHER_INSTRUCTIONS.get(philosopher.value, "")
        system = _LENTE_SYSTEM

        if selected_text:
            user_prompt = (
                f"Lente: {philosopher.value.capitalize()}\n"
                f"Istruzioni per questa lente: {instructions}\n\n"
                f"Testo completo per contesto:\n{context}\n\n"
                f"Passaggio selezionato su cui applicare la lente:\n\"{selected_text}\"\n\n"
                f"Applica la lente."
            )
        else:
            user_prompt = (
                f"Lente: {philosopher.value.capitalize()}\n"
                f"Istruzioni per questa lente: {instructions}\n\n"
                f"Testo da analizzare:\n\"{context}\"\n\n"
                f"Applica la lente."
            )

        return await LLMService.stream(
            feature="lente",
            system=system,
            user=user_prompt,
            max_tokens=500,
        )

    @staticmethod
    async def complete_socratica(context: str) -> tuple[str, str, str, int]:
        user_prompt = f"Testo scritto finora:\n\n{context}\n\n---\nGenera la domanda socratica."
        return await LLMService.complete("socratica", _SOCRATICA_SYSTEM, user_prompt, 300)

    @staticmethod
    async def complete_paradosso(context: str) -> tuple[str, str, str, int]:
        user_prompt = f"Testo da analizzare:\n\n{context}\n\n---\nTrova la contraddizione interna."
        return await LLMService.complete("paradosso", _PARADOSSO_SYSTEM, user_prompt, 400)

    @staticmethod
    async def complete_lente(
        context: str,
        philosopher: Philosopher,
        selected_text: str = "",
    ) -> tuple[str, str, str, int]:
        instructions = _PHILOSOPHER_INSTRUCTIONS.get(philosopher.value, "")
        if selected_text:
            user_prompt = (
                f"Lente: {philosopher.value.capitalize()}\n"
                f"Istruzioni per questa lente: {instructions}\n\n"
                f"Testo completo per contesto:\n{context}\n\n"
                f"Passaggio selezionato su cui applicare la lente:\n\"{selected_text}\"\n\n"
                f"Applica la lente."
            )
        else:
            user_prompt = (
                f"Lente: {philosopher.value.capitalize()}\n"
                f"Istruzioni per questa lente: {instructions}\n\n"
                f"Testo da analizzare:\n\"{context}\"\n\n"
                f"Applica la lente."
            )
        return await LLMService.complete("lente", _LENTE_SYSTEM, user_prompt, 500)

