window.addEventListener("load",function() {
  const getJSON = async url => {
    const response = await fetch(url);
    if(!response.ok) // check if response worked (no 404 errors etc...)
      throw new Error(response.statusText);

    const data = response.json(); // get JSON from the response
    return data; // returns a promise, which resolves to this data value
  }

  function success(text) {
    alert(text)
  }

  function missed(text) {
    alert(text)
  }

  function ask(word) {
    return new Promise(deliver => {
      const popup = document.createElement('form');
      popup.insertAdjacentHTML('afterbegin',
      `<fieldset>
        <label>Spell the word</label>
        <input type="text" name="input" />
      </fieldset>`);

      popup.addEventListener("submit", function(e) {
        e.preventDefault();
        popup.parentElement.removeChild(popup);
        deliver(e.target.input.value);
      });

      const skipButton = document.createElement('button');
      skipButton.type = 'button';
      skipButton.textContent = 'Skip';
      skipButton.addEventListener('click', function() {
        popup.parentElement.removeChild(popup);
        setTimeout(do_wordloop, 100);
      });
      popup.appendChild(skipButton);

      const repeatButton = document.createElement('button');
      repeatButton.type = 'button';
      repeatButton.textContent = 'Repeat';
      repeatButton.addEventListener('click', async function() {
        await play_audio(word.audio.female);
        await play_audio(word.audio.male);
      });
      popup.appendChild(repeatButton);

      document.body.appendChild(popup);
      popup.getElementsByTagName("input")[0].focus();
    });
  }

  function pick_elem(list) {
    return list[Math.floor(Math.random() * list.length)]
  }

  function play_audio(b64) {
    return new Promise(done => {
      var audio = new Audio("data:audio/wav;base64," + b64)
      audio.play()
      audio.onended = done
    })
  }

  async function do_wordloop() {
    var wordlist = window._word_data;

    var current_word = pick_elem(wordlist);
    await play_audio(current_word.audio.female);
    await play_audio(current_word.audio.male);

    var matching_word = await ask(current_word);
    if (matching_word == current_word.word || matching_word == current_word.alt) {
      success("You got it!");
    } else {
      missed(`Not quite! It was ${current_word.word}`);
    }
    setTimeout(do_wordloop, 100);
  }

  var button = document.createElement('button');
  button.innerHTML = "Let's Go!";
  button.onclick = function(){
    button.parentElement.removeChild(button);
    getJSON("word_audio.json").then(
      data => { window._word_data = data; do_wordloop(); }
    ).catch(
      error => { console.error(error); }
    );
    return false;
  };
  document.body.appendChild(button);
});
