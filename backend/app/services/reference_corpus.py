"""
Small fixed set of reference passages, standing in for "the web" until a real
search API (Google/Bing) gets wired in. Kept in memory since it's tiny -
no DB table needed for something this size.
"""
from app.services.embeddings import embed_chunks

REFERENCE_SOURCES = [
    {
        "id": "ref-photosynthesis",
        "title": "Photosynthesis - general biology reference",
        "text": (
            "Photosynthesis is the process by which green plants, algae, and some bacteria convert "
            "light energy into chemical energy stored in glucose. It takes place mainly in the "
            "chloroplasts of plant cells, using chlorophyll to absorb sunlight. The overall reaction "
            "combines carbon dioxide and water to produce glucose and oxygen, releasing oxygen as a "
            "byproduct into the atmosphere. This process is the foundation of most food chains on "
            "Earth, since it is the primary way solar energy enters biological systems."
        ),
    },
    {
        "id": "ref-french-revolution",
        "title": "French Revolution overview - history reference",
        "text": (
            "The French Revolution began in 1789 and fundamentally transformed French society, "
            "ending the absolute monarchy and the feudal system. Widespread economic hardship, "
            "food shortages, and resentment toward the privileges of the nobility and clergy fueled "
            "public anger. The storming of the Bastille became a symbol of the uprising against "
            "royal authority. The revolution eventually led to the rise of Napoleon Bonaparte and "
            "reshaped political ideas about citizenship and rights across Europe."
        ),
    },
    {
        "id": "ref-machine-learning",
        "title": "Machine learning definition - computer science reference",
        "text": (
            "Machine learning is a branch of artificial intelligence where systems learn patterns "
            "from data instead of following explicitly programmed rules. A model is trained on "
            "example data, adjusting its internal parameters to minimize the difference between its "
            "predictions and the actual outcomes. Once trained, the model can generalize to new, "
            "unseen data. Common categories include supervised learning, unsupervised learning, and "
            "reinforcement learning, each suited to different types of problems."
        ),
    },
    {
        "id": "ref-climate-change",
        "title": "Climate change causes - environmental science reference",
        "text": (
            "Climate change refers to long-term shifts in global temperatures and weather patterns, "
            "largely driven by human activity since the industrial era. Burning fossil fuels releases "
            "greenhouse gases such as carbon dioxide and methane, which trap heat in the atmosphere "
            "and cause the planet to warm. Consequences include rising sea levels, more frequent "
            "extreme weather events, and disruption to ecosystems. Reducing emissions and transitioning "
            "to renewable energy sources are widely considered necessary to limit further warming."
        ),
    },
    {
        "id": "ref-supply-demand",
        "title": "Supply and demand - economics reference",
        "text": (
            "Supply and demand is a fundamental economic model describing how the price of a good is "
            "determined in a market. As the price of a good rises, the quantity supplied by producers "
            "tends to increase while the quantity demanded by consumers tends to fall. The point where "
            "these two curves meet is called the equilibrium price, where the amount producers are "
            "willing to sell matches the amount consumers are willing to buy. Shifts in either supply "
            "or demand cause the equilibrium price and quantity to change."
        ),
    },
    {
        "id": "ref-wiki-ai",
        "title": "Wikipedia - Artificial Intelligence",
        "text": (
            "The study of mechanical or \"formal\" reasoning began with philosophers and mathematicians in antiquity. The study of logic led directly to Alan Turing's theory of computation, which suggested that a machine, by shuffling symbols as simple as \"0\" and \"1\", could simulate any conceivable form of mathematical reasoning.[366][367] This, along with concurrent discoveries in cybernetics, information theory and neurobiology, led researchers to consider the possibility of building an \"electronic brain\".[r] They developed several areas of research that would become part of AI,[369] such as McCulloch and Pitts design for \"artificial neurons\" in 1943,[120] and Turing's influential 1950 paper 'Computing Machinery and Intelligence', which introduced the Turing test and showed that \"machine intelligence\" was plausible.[370][367]"
            "Russell and Norvig agree with Turing that intelligence must be defined in terms of external behaviour, not internal structure.[1] However, they are critical that the test requires the machine to imitate humans. \"Aeronautical engineering texts\", they wrote, \"do not define the goal of their field as making 'machines that fly so exactly like pigeons that they can fool other pigeons.'\"[410] AI founder John McCarthy agreed, writing that \"Artificial intelligence is not, by definition, simulation of human intelligence\".[411] McCarthy defines intelligence as \"the computational part of the ability to achieve goals in the world\".[412] Another AI founder, Marvin Minsky, similarly describes it as \"the ability to solve hard problems\".[413] Artificial Intelligence: A Modern Approach defines it as the study of agents that perceive their environment and take actions that maximise their chances of achieving"
        ),
    },
]

_cached_embeddings: list[list[float]] | None = None


def get_reference_embeddings() -> list[list[float]]:
    global _cached_embeddings
    if _cached_embeddings is None:
        _cached_embeddings = embed_chunks([source["text"] for source in REFERENCE_SOURCES])
    return _cached_embeddings
