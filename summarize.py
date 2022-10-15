import cohere
import whisper
import os
api_key = 'FRyzo2xU7j2Cp9sPgpSHTafsBsuI3X4UnNmBmDZO'
co = cohere.Client(api_key)
model = whisper.load_model("base")

def to_transcript(filename):
    result = model.transcribe(filename.strip())
    print("**Full Transcript:**\n" + result["text"])
    return result["text"]

def do_cohere(prompt):
    n_generations = 4
    prediction = co.generate(
        model='large',
        prompt=prompt,
        return_likelihoods = 'GENERATION',
        stop_sequences=['"'],
        max_tokens = min(512, max(40, len(prompt)//10)),
        temperature=1,
        num_generations=n_generations,
        k=0,
        p=0.75)
    l = []
    for i in range(len(prediction.generations)):
        l.append(prediction.generations[i].text)
    return l

while True:
    try:
        line = input()
        t = to_transcript(line)
        items = do_cohere(t)
        for i in items:
            print("**Summarization " + str(items.index(i) + 1) + "**")
            print(i)
        os.remove(line.strip())
    except:
        print("The summarization failed. :sunglasses:")
        continue
