export const MessageType = {
  // as soon as the popup is loaded, background instructs content to start the scraping process
  SCRAPE_CONTENT_TEXT: 'SCRAPE_CONTENT_TEXT',

  // content scrapes the text, and ask background to start processing
  PREPARE: 'PREPARE',

  // background notifies popup that preparation is done, and it may start allowing queries
  PREPARATION_DONE: 'PREPARATION_DONE',

  // popup collects the question and passes it on to the background
  ASK_QUESTION: 'ASK_QUESTION',

  // background processes the answers and asks content to highlight them on the webpage
  HIGHLIGHT_ANSWER: 'HIGHLIGHT_ANSWER',

  // content sends to the popup the webpage elements which contain the answers so that they can they can iterated upon
  MAKE_ANSWERS_ITERABLE: 'MAKE_ANSWERS_ITERABLE',

  // content asks popup to stop the loading banner, indicating that answer highlighting is complete
  SEARCH_OPERATION_DONE: 'SEARCH_OPERATION_DONE',

  // popup asks content to navigate to the part of the webpage of a specific highlight
  SELECT: 'SELECT',

  // popup asks content to clear all the highlights in the webpage
  CLEAR: 'CLEAR'
};
