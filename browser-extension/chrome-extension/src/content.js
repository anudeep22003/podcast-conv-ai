import './css/inject.css';

import { convert } from 'html-to-text';
import Mark from 'mark.js';
import { removeStopwords } from 'stopword';
import { TidyURL } from 'tidy-url';

import { MessageType } from './message_types';

// this function removes all the tracking elements from the hyperlinks in the page
const cleanseAllUrlsInPage = () => {
  const allAnchorTags = document.getElementsByTagName("a");
  for (var i = 0; i < allAnchorTags.length; i++) {
    const anchorTag = allAnchorTags[i]
    const originalUrl = anchorTag.href
    anchorTag.href = TidyURL.clean(originalUrl).url
  }
}

// this function removes all stopwords from the text
// however this is very aggresive and might break functionality in some cases
const removeStopwordsInPageText = (fullText) => {
  const trimmedText = removeStopwords(fullText.split(" ")).join(" ")
  return trimmedText
}

// this function scrapes the complete DOM in plain readable text
// and sends it back to background for preparation
const scrapeContentAsPlainTextAndSendForPreparation = () => {
  cleanseAllUrlsInPage()

  const currentUrl = window.location.href;
  const options = {
    wordwrap: 130
  };

  const dirtyHtml = document.documentElement.outerHTML;
  const plainText = convert(dirtyHtml, options);

  chrome.runtime.sendMessage(
    {
      type: MessageType.PREPARE,
      url: currentUrl,
      material: plainText
    }
  );
}

// this function removes the trailing slash (if present) in any hyperlink to ensure consistency
function trimTrailingSlashInUrl(url) {
  if (url.substr(-1) === '/') {
    return url.substr(0, url.length - 1);
  }
  return url;
}

// this function removes all the highlights from the webpage
const removeHighlightsOnPage = () => {
  const markInstance = new Mark(document.body);
  markInstance.unmark();
}

// this function jumps the current focus of the webpage to the highlight element
const jumpToHighlight = (msg) => {
  const elementToJumpTo = document.getElementById(msg.elementId)
  elementToJumpTo.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });
}

// this function highlights all the elements that contain the answers received
const displayHighlightsOnPage = (msg) => {
  removeHighlightsOnPage();

  const allAnswers = msg.answer.answers
  allAnswers.forEach((answer) => {
    const answersReceived = answer["resp"]
    // if answer is `KZZ` (pre-decided), that means no response was found, so we skip
    if ("KZZ" == answersReceived) {
      return;
    }
    console.log(`content: answer to highlight - ${answersReceived}`)

    // there could be multiple results, we split by spaces
    // sometimes response like `A, B and C` are returned, we must carefully handle the `and` here
    const textsToHighlight = answersReceived.split(/,\s+|\s+and\s+/).map(c => c.trim().replace(/^and\s+/, ''));

    // go through the entire document finding the highlight texts
    const markInstance = new Mark(document.body)
    const highlightingOptions = {
      className: "xcuzme-highlighted",
      acrossElements: true,
      separateWordSearch: false,
      accuracy: "partially",
      ignoreJoiners: true
    };

    // apply the highlights
    markInstance.mark(textsToHighlight, highlightingOptions);

    // however sometimes answer can be in the hyperlinks, in that case we find the parent element and highlight that
    const cleansedPossiblyHyperlinks = textsToHighlight.map(trimTrailingSlashInUrl)
    const allHyperlinksInPage = document.querySelectorAll("a")
    allHyperlinksInPage.forEach(hyperlink => {
      if (cleansedPossiblyHyperlinks.includes(trimTrailingSlashInUrl(hyperlink.href))) {
        markInstance.mark(hyperlink.textContent, highlightingOptions)
      }
    })

    chrome.runtime.sendMessage(
      {
        type: MessageType.SEARCH_OPERATION_DONE,
      }
    );

    console.log(`content: highlighting of ${textsToHighlight.length} answers successful`)
  });

  // assign each of the highlighted elements a unique id and collect those ids
  const elementIdsOfHighlightedElements = []
  const highlightedResults = document.querySelectorAll("mark");
  highlightedResults.forEach((element, index) => {
    element.id = Math.random().toString(36).slice(2, 7);
    elementIdsOfHighlightedElements.push(element.id)
  });

  // send the list of ids to popup for iterability
  chrome.runtime.sendMessage(
    {
      type: MessageType.MAKE_ANSWERS_ITERABLE,
      answers: elementIdsOfHighlightedElements
    }
  );
}

const handleMsg = (msg, sender, callback) => {
  if (!msg) {
    return;
  }
  console.log('content: recieved msg:', msg, 'from:', sender);
  switch (msg.type) {
    case MessageType.PREPARE:
    case MessageType.PREPARATION_DONE:
    case MessageType.ASK_QUESTION:
    case MessageType.MAKE_ANSWERS_ITERABLE:
    case MessageType.SEARCH_OPERATION_DONE:
      break

    case MessageType.SCRAPE_CONTENT_TEXT:
      scrapeContentAsPlainTextAndSendForPreparation();
      break;

    case MessageType.HIGHLIGHT_ANSWER:
      displayHighlightsOnPage(msg);
      break;

    case MessageType.SELECT:
      jumpToHighlight(msg);
      break;
    case MessageType.CLEAR:
      removeHighlightsOnPage();
      break;

    default:
      console.error('content: did not recognize message type:', msg);
  }
};

chrome.runtime.onMessage.addListener(handleMsg);
