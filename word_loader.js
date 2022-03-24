window.addEventListener("load", function() {
    const getJSON = async url => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        const data = response.json(); // get JSON from the response
        return data; // returns a promise, which resolves to this data value
    }

    function storage_int(key) {
        return parseInt(sessionStorage.getItem(key));
    }

    function success(text) {
        var score = storage_int("score");
        score = score + 1;
        sessionStorage.setItem("score", score);

        var streak = storage_int("streak");
        streak = streak + 1;
        sessionStorage.setItem("streak", streak);

        const result = document.getElementById('result');
        result.innerText = text
        result.classList.replace("hidden", "success");

    }

    function missed(text) {
        var score = storage_int("score");
        score = Math.max(score - 1, 0);
        sessionStorage.setItem("score", score);
        sessionStorage.setItem("streak", 0);

        const result = document.getElementById('result');
        result.innerText = text;
        result.classList.replace("hidden", "missed");
    }

    function update_scoreboard() {
        document.getElementById("streak").innerText = `Streak: ${sessionStorage.getItem("streak")}`;
        document.getElementById("score").innerText = `Score: ${sessionStorage.getItem("score")}`;
    }

    function initialize_ui() {
        const ui = document.createElement('form');
        ui.id = "ui";

        const audio = document.createElement('audio');
        audio.id = "playback"
        ui.appendChild(audio);

        const scoreboard = document.createElement('div');
        scoreboard.classList.add('scoreboard');

        const score = document.createElement('div');
        score.id = 'score';
        sessionStorage.setItem("score", 0);
        score.textContent = "Score: 0";
        scoreboard.appendChild(score);

        const result = document.createElement('div');
        result.id = 'result';
        result.classList.add("hidden");
        result.textContent = 'empty';
        scoreboard.appendChild(result);

        const streak = document.createElement('div');
        streak.id = 'streak';
        sessionStorage.setItem("streak", 0);
        streak.textContent = "Streak: 0";
        scoreboard.appendChild(streak);

        ui.appendChild(scoreboard);

        const inbox = document.createElement("div");
        inbox.classList.add("inbox");

        const input = document.createElement('input');
        input.autocapitalize = "none";
        input.autocomplete = "off";
        input.autocorrect = "off";
        input.name = "input";
        input.id = "input";
        input.placeholder = "Spell The Word";
        inbox.appendChild(input);


        ui.appendChild(inbox);
        const buttonBox = document.createElement('div');
        buttonBox.classList.add("buttonbox");

        const skipButton = document.createElement('button');
        skipButton.type = 'button';
        skipButton.textContent = 'Skip';
        skipButton.addEventListener('click', function() {
            sessionStorage.setItem("streak", 0);
            setTimeout(next_word, 100);
        });
        buttonBox.appendChild(skipButton);

        const repeatButton = document.createElement('button');
        repeatButton.id = 'repeat';
        repeatButton.type = 'button';
        repeatButton.textContent = 'Repeat';
        repeatButton.addEventListener('click', speak_current_word);
        buttonBox.appendChild(repeatButton);
        ui.appendChild(buttonBox);

        ui.addEventListener("submit", function(e) {
            e.preventDefault();
            check_and_score(e.target.input.value.trim());
        });

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
        result.classList.add("hidden");
        result.classList.remove("success", "missed");
        const audio = document.getElementById("playback");
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        update_scoreboard();
    }

    function suppress_submit(e) {
        e.preventDefault();
        return false;
    }

    async function speak_current_word() {
        const input = document.getElementById("input");
        input.focus();

        const word = JSON.parse(sessionStorage.getItem("current_word"));
        await play_audio(word.audio.female);
        await play_audio(word.audio.male);
    }

    function next_word() {
        var wordlist = window._word_audio;
        var current_word = wordlist[Math.floor(Math.random() * wordlist.length)];
        sessionStorage.setItem("current_word", JSON.stringify(current_word));
        reset_ui();
        speak_current_word();
    }

    function check_and_score(matching_word) {
        const current_word = JSON.parse(sessionStorage.getItem("current_word"));
        if (matching_word == current_word.word || matching_word == current_word.alt) {
            success("You got it!");
        } else {
            missed(`Not quite! It was ${current_word.word}`);
        }

        update_scoreboard();
        // re-enter loop async
        setTimeout(next_word, 1000);
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
                next_word();
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