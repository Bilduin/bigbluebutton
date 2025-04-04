import React, { Component } from 'react';
import PropTypes from 'prop-types';
import injectWbResizeEvent from '/imports/ui/components/presentation/resize-wrapper/component';
import { defineMessages, injectIntl } from 'react-intl';
import {
  sendMessage,
  onMessage,
  removeAllListeners,
  getPlayingState,
} from './service';


import { ACTIONS } from '/imports/ui/components/layout/enums';

import Styled from './styles';


const messages = defineMessages({
  notStartedMessage: {
    id: 'app.bilduinPlayer.notStarted',
    description: 'Message shown when video has not started yet',
    defaultMessage: 'This session has not started yet',
  },
  endedMessage: {
    id: 'app.bilduinPlayer.ended',
    description: 'Message shown when video has ended',
    defaultMessage: 'This session has ended',
  },
});

class BilduinPlayer extends Component {
  static clearVideoListeners() {
    removeAllListeners('play');
    removeAllListeners('stop');
    removeAllListeners('playerUpdate');
    removeAllListeners('presenterReady');
  }

  constructor(props) {
    super(props);
    this.state = {
      isMuted: true,
      duration: null,
      shouldPlay: false, // Tracks if the video should be playing
      userHasInteracted: false, // Track if user has interacted with the page
    };

    this.checkPlaybackStatus = this.checkPlaybackStatus.bind(this);
    this.handleGlobalClick = this.handleGlobalClick.bind(this);
  }

  componentDidMount() {
    const { layoutContextDispatch } = this.props;

    // Add window-level click listener for detecting user interaction
    window.addEventListener('click', this.handleGlobalClick);

    layoutContextDispatch({
      type: ACTIONS.SET_HAS_EXTERNAL_VIDEO,
      value: true,
    });

    layoutContextDispatch({
      type: ACTIONS.SET_PRESENTATION_IS_OPEN,
      value: true,
    });

    // Start the interval to check video status
    this.timer = setInterval(this.checkPlaybackStatus, 1000);
  }

  componentWillUnmount() {
    // Clean up event listener and timer
    window.removeEventListener('click', this.handleGlobalClick);
    clearInterval(this.timer);
  }

  handleGlobalClick() {
    // Update userHasInteracted state when user clicks anywhere on the window
    if (!this.state.userHasInteracted) {
      this.setState({ userHasInteracted: true });
    }
  }

  handleDuration = (duration) => {
    this.setState({ duration });
  }

  checkPlaybackStatus() {
    const { startTime } = this.props;
    const { duration } = this.state;

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsedTime = now - startTime;
    const hasStarted = startTime <= now;
    const hasEnded = duration && (elapsedTime > duration);

    // Update `shouldPlay` state based on the conditions
    if (hasStarted && !hasEnded && !this.state.shouldPlay) {
      this.setState({ shouldPlay: true });
    } else if ((!hasStarted || hasEnded) && this.state.shouldPlay) {
      this.setState({ shouldPlay: false });
    }
  }

  renderMessage(message) {
    const {
      top,
      left,
      right,
      height,
      width,
      fullscreenContext,
      isResizing,
      zIndex,
    } = this.props;

    return (
      <span
        style={{
          position: 'absolute',
          top,
          left,
          right,
          height,
          width,
          pointerEvents: isResizing ? 'none' : 'inherit',
          background: 'var(--color-black)',
          overflow: 'hidden',
          zIndex,
        }}
      >
        <Styled.MessageWrapper id="message-wrapper">
          <Styled.Message id="message">
            {message}
          </Styled.Message>
        </Styled.MessageWrapper>
      </span>
    );
  }

  render() {
    const {
      isPresenter,
      intl,
      top,
      left,
      right,
      height,
      width,
      fullscreenContext,
      isResizing,
      zIndex,
      layoutContextDispatch,
      hidePresentationOnJoin,
      startTime,
      videoUrl,
      isUsingAudio
    } = this.props;

    const { isMuted, duration, shouldPlay, userHasInteracted } = this.state;

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const elapsedTime = now - startTime;
    
    // Only consider the video ended if:
    // 1. We have a valid duration
    // 2. The elapsed time is greater than the duration
    const hasEnded = duration && (elapsedTime > duration);

    // Update the condition to check for hasEnded
    let startTimeString = new Date(startTime * 1000).toTimeString().slice(0, 5);
    if (!shouldPlay || hasEnded) {
      const message = elapsedTime < 0
        ? intl.formatMessage(messages.notStartedMessage, { 0: startTimeString })
        : intl.formatMessage(messages.endedMessage);

      return this.renderMessage(message);
    }

    return (
      <span
        style={{
          position: 'absolute',
          top,
          left,
          right,
          height,
          width,
          pointerEvents: isResizing ? 'none' : 'inherit',
          background: 'var(--color-black)',
          overflow: 'hidden',
          zIndex,
        }}
      >
        <Styled.VideoPlayerWrapper
          id="video-player"
          data-test="videoPlayer"
        >
          <Styled.VideoPlayer
            onContextMenu={(e) => e.preventDefault()}
            url={videoUrl}
            controls={false}
            playing={true}
            muted={!(userHasInteracted && isUsingAudio)} // Only unmute if user has interacted AND isUsingAudio is true
            height="100%"
            width="100%"
            progressInterval={1000}
            playsinline
            config={{
              file: {
                attributes: {
                  // crossOrigin: 'true',
                },
              },
            }}
            playbackRate={1}
            onDuration={this.handleDuration}
            onStart={() => {
              if (this.player) {
                const currentTime = (now - startTime);
                this.player.seekTo(currentTime);
              }
            }}
            ref={(player) => { this.player = player; }}
          />
        </Styled.VideoPlayerWrapper>
      </span>
    );
  }
}

BilduinPlayer.propTypes = {
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  fullscreenElementId: PropTypes.string.isRequired,
  fullscreenContext: PropTypes.bool.isRequired,
  videoUrl: PropTypes.string.isRequired,
};

export default injectIntl(injectWbResizeEvent(BilduinPlayer));