const getJSON = async url => {
  const response = await fetch(url);
  if(!response.ok) // check if response worked (no 404 errors etc...)
    throw new Error(response.statusText);

  const data = response.json(); // get JSON from the response
  return data; // returns a promise, which resolves to this data value
}


function pick_elem(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function play_audio(b64) {
  return new Promise(done=>{
    var audio = new Audio("data:audio/wav;base64," + b64)
    audio.play()
    audio.onended = done
  })
}
  
async function do_wordloop(wordlist) {

  while (true) {
    var current_word = pick_elem(wordlist);
    await play_audio(current_word.audio.female);
    await play_audio(current_word.audio.male);
    
    var matching_word = prompt("How do you spell it?");
    if (matching_word == current_word.word) {
      alert("You got it!");
    } else {
      if ('alt' in current_word) {
        if(matching_word == current_word.alt) {
          alert("Success!");
        } else {
          alert("Not quite! It's " + current_word.word);
        }
      } else {
          alert("Not quite! It's " + current_word.word);
      }
    }
  }
}

getJSON("word_audio.json").then(data => { do_wordloop(data); }).catch(error => { console.error(error); });
