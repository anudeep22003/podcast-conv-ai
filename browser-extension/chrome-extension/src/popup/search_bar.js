import { CircularProgress, Grid, IconButton, TextField } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import SearchIcon from '@material-ui/icons/Search';
import React, { useEffect, useRef, useState } from 'react';
import { hot } from 'react-hot-loader';

import { MessageType } from '../message_types';

const SearchBarState = {
  PREPARATION_ONGOING: 'PREPARATION_ONGOING',
  READY: 'READY',
  LOADING: 'LOADING',
  DONE: 'DONE'
};

// this function sends a message to the content script on the current tab
const sendMessageToContent = (message) => {
  console.log('popup: send msg to content:', message);
  chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, message);
  });
};

// this function sends a message to the background script
const sendMessageToBackground = (message) => {
  console.log('popup: send msg to background:', message);
  chrome.runtime.sendMessage(message);
};

const registerListener = (setState, setAnswers, setErrors) => {
  chrome.runtime.onMessage.addListener((msg, sender, callback) => {
    console.log('popup: recieved msg:', msg, 'from:', sender);
    switch (msg.type) {
      case MessageType.HIGHLIGHT_ANSWER:
      case MessageType.PREPARE:
      case MessageType.ASK_QUESTION:
      case MessageType.SELECT:
      case MessageType.CLEAR:
        break;

      case MessageType.PREPARATION_DONE:
        setState(SearchBarState.READY);
        break;

      case MessageType.MAKE_ANSWERS_ITERABLE:
        setAnswers((answers) =>
          [...answers, ...msg.answers]
        );
        setState(SearchBarState.DONE);
        break;

      case MessageType.SEARCH_OPERATION_DONE:
        setState(SearchBarState.DONE);
        break;

      default:
        console.error('popup: did not recognize message type:', msg);
        break;
    }
  });
};

const SearchBarInput = (props) => {
  const inputRef = useRef();

  useEffect(() => {
    if (props.state === SearchBarState.READY) {
      inputRef.current.focus();
    }
  }, [props.state]);

  return (
    <TextField
      inputRef={inputRef}
      fullWidth
      input={props.input}
      onChange={(e) => {
        props.setInput(e.target.value);
      }}
      disabled={props.state !== SearchBarState.READY}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          props.search();
        }
      }}
    />
  );
};

const SearchBarControl = (props) => {
  console.log(props.answers)
  if (props.state === SearchBarState.PREPARATION_ONGOING) {
    return (
      <Grid container spacing={2}>
        <Grid item>
          <CircularProgress size={22} />
        </Grid>
        <Grid item style={{ margin: 'auto auto' }}>
          <span>Contextualizing webpage...</span>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container>
      <Grid item>
        <IconButton
          size="small"
          disabled={props.selectionIdx >= props.answers.length - 1}
          onClick={() => {
            props.setSelectionIdx((idx) => idx + 1);
          }}>
          <KeyboardArrowDownIcon />
        </IconButton>
      </Grid>
      <Grid item>
        <IconButton
          size="small"
          disabled={props.selectionIdx === 0}
          onClick={() => {
            props.setSelectionIdx((idx) => idx - 1);
          }}>
          <KeyboardArrowUpIcon />
        </IconButton>
      </Grid>
      {props.state === SearchBarState.READY && (
        <Grid item>
          <IconButton size="small" onClick={props.search}>
            <SearchIcon />
          </IconButton>
        </Grid>
      )}
      {props.state === SearchBarState.LOADING && (
        <Grid item>
          <IconButton size="small" disabled>
            <CircularProgress size={22} />
          </IconButton>
        </Grid>
      )}
      {props.state === SearchBarState.DONE && (
        <Grid item>
          <IconButton size="small" onClick={props.reset}>
            <CloseIcon />
          </IconButton>
          <Grid item style={{ margin: 'auto auto' }}>
          <span>{props.answers[0]}, {props.answers[1]}</span>
        </Grid>
        </Grid>
      )}
    </Grid>
  );
};

const SearchIndicator = (props) => {
  // if there are not answers found, then we go blank
  // if (props.state === SearchBarState.DONE && props.answers.length === 0) {
  //   return <span style={{ textAlign: 'center' }}>No Results</span>;
  // }

  if (props.answers.length === 0) {
    return null;
  }

  // if there are answers, we display it properly
  return (
    <span>
      {props.selectionIdx + 1}/{props.answers.length}
    </span>
  );
};

const SearchBar = (props) => {
  var [answers, setAnswers] = useState([]);
  var [errors, setErrors] = useState([]);
  var [state, setState] = useState(SearchBarState.READY);
  var [selectionIdx, setSelectionIdx] = useState(0);
  var [input, setInput] = useState('');

  // Register event listeners for recieving answers and errors
  // from the content script.
  useEffect(() => {
    registerListener(setState, setAnswers, setErrors);
  }, [setState, setAnswers, setErrors]);

  // Fire a selection event any time answers or selected index
  // changes.
  useEffect(() => {
    if (selectionIdx >= answers.length) {
      return;
    }

    sendMessageToContent({
      type: MessageType.SELECT,
      elementId: answers[selectionIdx]
    });
  }, [selectionIdx, answers]);

  useEffect(() => {
    sendMessageToBackground({
      type: MessageType.POPUP_LOADED
    });
  }, []);

  const search = () => {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentUrl = tabs[0].url;
      sendMessageToBackground({
        type: MessageType.ASK_QUESTION,
        query: input,
        url: currentUrl
      });
    });

    setState(SearchBarState.LOADING);
  };

  const reset = () => {
    sendMessageToContent({
      type: MessageType.CLEAR
    });

    setAnswers([]);
    setErrors([]);
    setSelectionIdx(0);
    setState(SearchBarState.READY);
  };

  const gridStyle = {
    width: '450px',
    padding: '10px',
    paddingBottom: '5px'
  };

  const itemStyle = {
    margin: 'auto auto'
  };

  return (
    <Grid container style={gridStyle} spacing={2}>
      <Grid item style={itemStyle} xs={state === SearchBarState.READY ? 9 : 8}>
        <SearchBarInput
          state={state}
          input={input}
          setInput={setInput}
          search={search}
        />
      </Grid>
      {state === SearchBarState.LOADING || state === SearchBarState.DONE ? (
        <Grid item style={itemStyle} answers={answers} xs={1}>
          <SearchIndicator
            state={state}
            answers={answers}
            selectionIdx={selectionIdx}
          />
        </Grid>
      ) : null}
      <Grid item style={itemStyle}>
        <SearchBarControl
          input={input}
          search={search}
          reset={reset}
          state={state}
          answers={answers}
          selectionIdx={selectionIdx}
          setSelectionIdx={setSelectionIdx}
        />
      </Grid>
    </Grid>
  );
};

export default hot(module)(SearchBar);