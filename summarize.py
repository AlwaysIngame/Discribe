import cohere
import whisper
import os
from better_profanity import profanity
import datetime
import json

api_key = json.load(open('./config.json'))["api_key"]
co = cohere.Client(api_key)
model = whisper.load_model("base")
currtime = None


def to_transcript(filename):
    result = profanity.censor(model.transcribe(filename.strip())["text"], '\*')
    os.remove(filename.strip())
    print(
        "**:arrow_down: Full Transcript from call at "
        + currtime
        + " :arrow_down:**\n"
        + result
    )
    return result


def do_cohere(prompt):
    try:
        n_generations = 4
        prediction = co.generate(
            model="large",
            prompt=prompt,
            return_likelihoods="GENERATION",
            stop_sequences=['"'],
            max_tokens=min(512, max(40, len(prompt) // 20)),
            temperature=0.6,
            num_generations=n_generations,
            k=0,
            p=0.75,
        )
        l = set()
        for i in prediction.generations:
            if len(i.text) < len(prompt):
                l.add(i.text)
        return list(l)
    except cohere.error.CohereError:
        return ["No bad words in summarization :bangbang:"]


while True:
    line = input()
    currtime = datetime.datetime.now().strftime("%m/%d/%Y, %H:%M:%S")
    t = to_transcript(line)
    items = do_cohere(t)
    for i in range(len(items)):
        print("**:arrow_down: Summarization " + str(i + 1) + " :arrow_down:**")
        print(items[i])
