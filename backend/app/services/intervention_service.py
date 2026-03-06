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
Sei la Voce Socratica — un interlocutore filosofico implacabile.
Il tuo compito NON è aiutare l'autore a scrivere meglio:
è identificare l'assunzione più nascosta nel testo e restituire
UNA domanda tagliente che la destabilizzi, più il suo sottotesto.

Formato OBBLIGATORIO (markdown):
**Domanda:** [la domanda che smonta l'assunzione nascosta]
**Sottotesto:** [cosa implica questa domanda sulla credenza più profonda dell'autore]

Regole:
- Massimo 3 frasi totali
- Sii chirurgico, non didattico
- La domanda deve essere scomoda, non retorica
- Scrivi in italiano
"""

_PARADOSSO_SYSTEM = """\
Sei il Motore del Paradosso — un analizzatore di contraddizioni strutturali.
Trova la tensione interna nel testo: non un errore logico superficiale,
ma una contraddizione profonda dove due affermazioni centrali si escludono a vicenda.

Formato OBBLIGATORIO (markdown):
**Tensione:** [le due affermazioni che si contraddicono]
**Nucleo:** [la contraddizione irrisolvibile che questo rivela]

Regole:
- Massimo 4 frasi totali
- Identifica la tensione strutturale, non stilistica
- Sii preciso, cita le parole esatte del testo
- Scrivi in italiano
"""

_LENTE_SYSTEM_TEMPLATE = """\
Sei {philosopher}, e stai leggendo questo testo con il tuo framework filosofico.
Non spiegarti: applica il tuo metodo e critica.

Formato OBBLIGATORIO (markdown):
**Lettura:** [come {philosopher} legge questo testo — 1-2 frasi]
**Critica:** [la critica più tagliente da questa prospettiva — 1-2 frasi]
**Domanda:** [la domanda che {philosopher} pone all'autore — 1 frase]

Regole:
- Usa concetti specifici del tuo pensiero (cita opere reali se pertinente)
- Non citare autori a caso come se fossero tuoi — SEI {philosopher}
- Scrivi in italiano
- Massimo 6 frasi totali
"""

_PHILOSOPHER_CONTEXTS: dict[str, str] = {
    Philosopher.PLATONE: "Platonico, maestro della dialettica e delle Idee, del Simposio e della Repubblica.",
    Philosopher.ARISTOTELE: "Aristotelico, logico, teleologico — autore dell'Etica Nicomachea e della Poetica.",
    Philosopher.KANT: "Kantiano, critico della ragione pura e pratica — imperativo categorico e limiti della conoscenza.",
    Philosopher.HEGEL: "Hegeliano, dialettico — tesi, antitesi, sintesi; Fenomenologia dello Spirito.",
    Philosopher.NIETZSCHE: "Nietzscheano — genealogia della morale, volontà di potenza, nichilismo, eterno ritorno.",
    Philosopher.HEIDEGGER: "Heideggeriano — essere-nel-mondo, Dasein, gettatezza, Essere e Tempo.",
    Philosopher.FOUCAULT: "Foucaultiano — archeologia del sapere, genealogia del potere, biopolitica, sorveglianza.",
    Philosopher.WITTGENSTEIN: "Wittgensteiniano — giochi linguistici, limiti del linguaggio, Ricerche Filosofiche.",
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
        """Voce Socratica — destabilising question + subtext."""
        user_prompt = f"Testo dell'autore:\n\n{context}"
        return await LLMService.stream(
            feature="socratica",
            system=_SOCRATICA_SYSTEM,
            user=user_prompt,
            max_tokens=256,
        )

    @staticmethod
    async def paradosso(
        context: str,
    ) -> tuple[AsyncIterator[str], str, str]:
        """Paradosso — structural contradiction + core tension."""
        user_prompt = f"Testo dell'autore:\n\n{context}"
        return await LLMService.stream(
            feature="paradosso",
            system=_PARADOSSO_SYSTEM,
            user=user_prompt,
            max_tokens=320,
        )

    @staticmethod
    async def lente(
        context: str,
        philosopher: Philosopher,
    ) -> tuple[AsyncIterator[str], str, str]:
        """Lente Filosofica — philosopher-specific reading + critique."""
        ctx = _PHILOSOPHER_CONTEXTS.get(philosopher, "")
        system = _LENTE_SYSTEM_TEMPLATE.format(philosopher=philosopher.value)
        if ctx:
            system = f"{system}\n\nContesto: {ctx}"

        user_prompt = f"Testo da analizzare:\n\n{context}"
        return await LLMService.stream(
            feature="lente",
            system=system,
            user=user_prompt,
            max_tokens=384,
        )

    @staticmethod
    async def complete_socratica(context: str) -> tuple[str, str, str, int]:
        return await LLMService.complete("socratica", _SOCRATICA_SYSTEM,
                                         f"Testo dell'autore:\n\n{context}", 256)

    @staticmethod
    async def complete_paradosso(context: str) -> tuple[str, str, str, int]:
        return await LLMService.complete("paradosso", _PARADOSSO_SYSTEM,
                                         f"Testo dell'autore:\n\n{context}", 320)

    @staticmethod
    async def complete_lente(context: str, philosopher: Philosopher) -> tuple[str, str, str, int]:
        ctx = _PHILOSOPHER_CONTEXTS.get(philosopher, "")
        system = _LENTE_SYSTEM_TEMPLATE.format(philosopher=philosopher.value)
        if ctx:
            system = f"{system}\n\nContesto: {ctx}"
        return await LLMService.complete("lente", system,
                                         f"Testo da analizzare:\n\n{context}", 384)
