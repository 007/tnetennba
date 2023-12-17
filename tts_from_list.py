import base64
import json
import os
import sys

from google.cloud import texttospeech as gcp_tts


def log(x):
    print(x, file=sys.stderr, flush=True)


def text_to_speech(word):
    testing = False
    if testing and word != "wide":
        audio = base64.b64encode("hello".encode("utf-8")).decode("utf-8")
        return {"male": audio, "female": audio}
    else:
        # Instantiates a client
        client = gcp_tts.TextToSpeechClient()

        # Set the text input to be synthesized
        synthesis_input = gcp_tts.SynthesisInput(text=word)

        # Build the voice request, select the language code ("en-US") and the named voice
        # from https://cloud.google.com/text-to-speech/docs/voices
        # Male voices:   en-US-Wavenet-A, en-US-Wavenet-B, en-US-Wavenet-D, en-US-Wavenet-I, en-US-Wavenet-J
        # Female voices: en-US-Wavenet-C, en-US-Wavenet-E, en-US-Wavenet-F, en-US-Wavenet-G, en-US-Wavenet-H

        # good choices from https://cloud.google.com/text-to-speech samples
        # gender / voice / speaking_rate / pitch
        # M / B / 0.8 / -2
        # F / C / 0.8 / +6
        # F / F / 0.8 / +2
        # F / H / 0.8 / -2
        voice_male = gcp_tts.VoiceSelectionParams(language_code="en-US", name="en-US-Wavenet-B")
        voice_female = gcp_tts.VoiceSelectionParams(language_code="en-US", name="en-US-Wavenet-H")

        # Select the type of audio file you want returned
        audio_config = gcp_tts.AudioConfig(audio_encoding=gcp_tts.AudioEncoding.MP3, speaking_rate=0.8, pitch=-2.0)
        male_response = client.synthesize_speech(input=synthesis_input, voice=voice_male, audio_config=audio_config)
        female_response = client.synthesize_speech(input=synthesis_input, voice=voice_female, audio_config=audio_config)

        male_audio = base64.b64encode(male_response.audio_content).decode("utf-8")
        female_audio = base64.b64encode(female_response.audio_content).decode("utf-8")

        return {"male": male_audio, "female": female_audio}


def word_to_path(word):
    word_fn = word.replace(" ", "-").lower()
    word_prefix = word[0].lower()
    return f"words/audio/{word_prefix}/{word_fn}.json"


def get_cached_audio(word):
    audio_path = word_to_path(word)
    try:
        with open(audio_path, "r") as f:
            audio = json.load(f)
            log(f"Got cache for {word}")
            return audio
    except:
        log(f"Failed to find cache for {word} at {audio_path}")
        pass


def cache_audio(word, data):
    audio_path = word_to_path(word)
    with open(audio_path, "w") as f:
        json.dump(data, f, indent=4)


word_files = [
    "wordlist.1b.txt",
    "wordlist.2b.txt",
    "wordlist.3b.txt",
]

current_year_path = "words/year/2024"

wordlist = []

for word_file in word_files:
    with open(os.path.join(current_year_path, word_file)) as f:
        for line in f:
            working_line = line.strip()
            parts = working_line.split("/", 1)
            log(f"Processing {parts[0]}...        ")
            speech_data = get_cached_audio(parts[0])
            if speech_data is None:
                speech_data = text_to_speech(parts[0])
                cache_audio(parts[0], speech_data)
            if len(parts) == 1:
                wordlist.append({"word": parts[0], "audio": speech_data})
            else:
                wordlist.append({"word": parts[0], "alt": parts[1].split("/"), "audio": speech_data})
log("Done")
print(json.dumps(wordlist))
