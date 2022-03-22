window.addEventListener("load", function() {
    const getJSON = async url => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const data = response.json(); // get JSON from the response
        return data; // returns a promise, which resolves to this data value
    }

    function success(text) {
        const result = document.getElementById('result');
        result.innerText = text
        result.classList.replace("hidden", "success");
    }

    function missed(text) {
        const result = document.getElementById('result');
        result.innerText = text;
        result.classList.replace("hidden", "missed");
    }

    function initialize_ui() {
        const ui = document.createElement('form');
        ui.id = "ui";

        const audio = document.createElement('audio');
        audio.id = "playback"
        ui.appendChild(audio);

        const fields = document.createElement('fieldset');
        const lab = document.createElement('label');
        lab.textContent = 'Spell the word';
        fields.appendChild(lab);

        const input = document.createElement('input');
        input.autocapitalize = "none";
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.name = "input";
        input.id = "input";
        fields.appendChild(input);

        ui.appendChild(fields);
        const buttonBox = document.createElement('div');
        buttonBox.classList.add("buttonbox");

        const skipButton = document.createElement('button');
        skipButton.type = 'button';
        skipButton.textContent = 'Skip';
        skipButton.addEventListener('click', function() {
            setTimeout(do_wordloop, 100);
        });
        buttonBox.appendChild(skipButton);

        const repeatButton = document.createElement('button');
        repeatButton.id = 'repeat';
        repeatButton.type = 'button';
        repeatButton.textContent = 'Repeat';
        repeatButton.addEventListener('click', speak_current_word);
        buttonBox.appendChild(repeatButton);

        ui.appendChild(buttonBox);

        const result = document.createElement('div');
        result.id = 'result';
        result.classList.add("hidden");
        result.textContent = 'empty';
        ui.appendChild(result);

        document.body.appendChild(ui);
    }

    function play_audio(b64) {
        return new Promise(done => {
            const audio = document.getElementById("playback");
            audio.src = "data:audio/wav;base64," + b64;
            audio.play();
            audio.onended = done;
        });
    }

    function reset_ui() {
        const input = document.getElementById("input");
        input.value = ""
        input.focus();
        const result = document.getElementById("result");
        result.classList.replace("success", "hidden");
        result.classList.replace("missed", "hidden");
        const audio = document.getElementById("playback");
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
    }

    function ui_input() {
        return new Promise(done => {
            document.getElementById("ui").addEventListener("submit", function(e) {
                e.preventDefault();
                this.removeEventListener('submit', arguments.callee);
                done(e.target.input.value.trim());
            });
        });
    }

    async function speak_current_word() {
        const input = document.getElementById("input");
        input.focus();

        const word = JSON.parse(sessionStorage.getItem("current_word"));
        await play_audio(word.audio.female);
        await play_audio(word.audio.male);
    }

    async function do_wordloop() {
        var wordlist = window._word_audio;
        var current_word = wordlist[Math.floor(Math.random() * wordlist.length)];
        sessionStorage.setItem("current_word", JSON.stringify(current_word));

        reset_ui();

        speak_current_word();

        var matching_word = await ui_input();
        if (matching_word == current_word.word || matching_word == current_word.alt) {
            success("You got it!");
        } else {
            missed(`Not quite! It was ${current_word.word}`);
        }

        // re-enter loop async
        setTimeout(do_wordloop, 1000);
    }

    // initialize page onload, create button to force interaction and kick off loading + audio
    var button = document.createElement('button');
    button.innerHTML = "Let's Go!";
    button.onclick = function() {
        button.parentElement.removeChild(button);
        getJSON("word_audio.json").then(
            data => {
                window._word_audio = data;
                initialize_ui();
                do_wordloop();
            }
        ).catch(
            error => {
                console.error(error);
            }
        );
        return false;
    };
    document.body.appendChild(button);
});