import cohere
import whisper
import os
from better_profanity import profanity
api_key = 'FRyzo2xU7j2Cp9sPgpSHTafsBsuI3X4UnNmBmDZO'
co = cohere.Client(api_key)
model = whisper.load_model("base")

def to_transcript(filename):
    result = model.transcribe(filename.strip())
    print("**:arrow_down: Full Transcript :arrow_down:**\n" + result["text"])
    return result["text"]

def do_cohere(prompt):
    try:
        n_generations = 4
        prediction = co.generate(
            model='large',
            prompt=profanity.censor(prompt),
            return_likelihoods = 'GENERATION',
            stop_sequences=['"'],
            max_tokens = min(512, max(40, len(prompt)//10)),
            temperature=1,
            num_generations=n_generations,
            k=0,
            p=0.75)
        l = set()
        for i in range(len(prediction.generations)):
            l.add(prediction.generations[i].text)
        return list(l)
    except cohere.error.CohereError:
        return ["No bad words in summarization :bangbang:"]


while True:
    line = input()
    t = to_transcript(line)
    items = do_cohere(t)
    for i in range(len(items)):
        print("**:arrow_down: Summarization " + str(i + 1) + " :arrow_down:**")
        print(items[i])
    os.remove(line.strip())
    continue
