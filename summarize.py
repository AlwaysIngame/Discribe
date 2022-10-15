import cohere
import time
import pandas as pd
import torch
import whisper

def main(filename):
    start_time = time.time()
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(torch.cuda.is_available())
    model = whisper.load_model("base", device)
    result = model.transcribe(filename)
    print("--- %s seconds ---" % (time.time() - start_time))
    return result["text"]

while True:
    filename = input()
    if filename:
        full_transcript = main(filename)
        break

api_key = 'FRyzo2xU7j2Cp9sPgpSHTafsBsuI3X4UnNmBmDZO'
co = cohere.Client(api_key)
prompt = full_transcript
print(prompt)
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
# Get list of generations
gens = []
likelihoods = []
for gen in prediction.generations:
    gens.append(gen.text)
    sum_likelihood = 0
    for t in gen.token_likelihoods:
        sum_likelihood += t.likelihood
    # Get sum of likelihoods
    likelihoods.append(sum_likelihood)
pd.options.display.max_colwidth = 200
# Create a dataframe for the generated sentences and their likelihood scores
df = pd.DataFrame({'generation':gens, 'likelihood': likelihoods})
# Drop duplicates
df = df.drop_duplicates(subset=['generation'])
# Sort by highest sum likelihood
df = df.sort_values('likelihood', ascending=False, ignore_index=True)

summary1 = prediction.generations[0].text
summary2 = prediction.generations[1].text
summary3 = prediction.generations[2].text
summary4 = prediction.generations[3].text


print("------------sum1-------------")
print(summary1)
print("------------sum2-------------")
print(summary2)
print("------------sum3-------------")
print(summary3)
print("------------sum4-------------")
print(summary4)