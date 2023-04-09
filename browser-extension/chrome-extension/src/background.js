import '../public/icons/icon_128.png';
import '../public/icons/icon_16.png';
import '../public/icons/icon_48.png';

import { MessageType } from './message_types';

// this function sends a message to the content script on the current tab
const sendMessageToContent = (message) => {
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab) {
      console.log('background: send msg to content:', message);
      chrome.tabs.sendMessage(activeTab.id, message);
    } else {
      console.log('background: unable to send msg, no active tab:', message);
    }
  });
};

// this function sends a message to the popup
const sendMessageToPopup = (message) => {
  console.log('background: send msg to popup:', message);
  chrome.runtime.sendMessage(message);
};

// this function calls the backend with the preparation material expecting a 200 OK response
const askBackendToPrepare = (msg) => {
  fetch("https://xcuzme.taptappers.club/api/v1/prepare", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "url": msg.url,
      "content": msg.material
    })
  })
    .then(response => {
      if (!response.ok) {
        const err = "background: backend api call for preparation failed"
        console.log(err)
        throw new Error(err, response)
      }
    })
    .then(_ => {
      sendMessageToPopup({
        type: MessageType.PREPARATION_DONE
      });
      console.log("preparation: successfully done");
    })
}

// this function calls the backend with the question expecting an apt answer
const getAnswerFromBackend = (msg) => {
  const video_id = msg.url.split("=")[1]

  fetch(`http://localhost:8000/response?video_id=${video_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "query": msg.query
    })
  })
    .then(response => {
      if (!response.ok) {
        const err = "background: backend api call for answering failed"
        console.log(err)
        throw new Error(err, response)
      } else {
        return response.json()
      }
    })
    .then(answers => {
      console.log(msg)
      const videoId = msg.url.split("=")[1]
      const startTime = Math.trunc(answers.sources.split("-")[0].trim())
      const endTime = Math.trunc(answers.sources.split("-")[1].trim())

      const videoUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}`
      // chrome.tabs.create({ url: videoUrl });
      // sendMessageToContent({
      //   type: MessageType.HIGHLIGHT_ANSWER,
      //   answer: answers
      // });

      chrome.runtime.sendMessage(
        {
          type: MessageType.MAKE_ANSWERS_ITERABLE,
          answers: [answers.response, videoUrl]
        }
      );

      // chrome.runtime.sendMessage(
      //   {
      //     type: MessageType.SEARCH_OPERATION_DONE,
      //   }
      // );

      setTimeout(() => {
        chrome.tabs.create({ url: videoUrl });
      }, "7000");

      // setTimeout(chrome.tabs.create({ url: videoUrl }), 5000);

      console.log("background: successfully done");
    });
}

chrome.runtime.onMessage.addListener((msg, sender, callback) => {
  console.log('background: recieved msg:', msg, 'from:', sender);
  switch (msg.type) {
    case MessageType.PREPARATION_DONE:
    case MessageType.HIGHLIGHT_ANSWER:
    case MessageType.MAKE_ANSWERS_ITERABLE:
    case MessageType.SEARCH_OPERATION_DONE:
    case MessageType.SELECT:
    case MessageType.CLEAR:
    case MessageType.POPUP_LOADED:
      break;

    // case MessageType.POPUP_LOADED:
    //   sendMessageToContent({
    //     type: MessageType.SCRAPE_CONTENT_TEXT
    //   });

    //   break;

    case MessageType.PREPARE:
      return askBackendToPrepare(msg);

    case MessageType.ASK_QUESTION:
      return getAnswerFromBackend(msg);

    default:
      console.error('background: did not recognize message type: ', msg);
      return true;
  }
});
