import React from 'react';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import getFromUserSettings from '/imports/ui/services/users-settings';
import BilduinVideoComponent from './component';
import AudioService from '/imports/ui/components/audio/service';
import {
  layoutSelect,
  layoutSelectInput,
  layoutSelectOutput,
  layoutDispatch,
} from '../layout/context';

const ExternalBilduinContainer = (props) => {
  const fullscreenElementId = 'ExternalVideo';
  const externalVideo = layoutSelectOutput((i) => i.externalVideo);
  const cameraDock = layoutSelectInput((i) => i.cameraDock);
  const { isResizing } = cameraDock;
  const layoutContextDispatch = layoutDispatch();
  const fullscreen = layoutSelect((i) => i.fullscreen);
  const { element } = fullscreen;
  const fullscreenContext = (element === fullscreenElementId);

  return (
    <BilduinVideoComponent
      {
      ...{
        layoutContextDispatch,
        ...props,
        ...externalVideo,
        isResizing,
        fullscreenElementId,
        fullscreenContext,
      }
      }
    />
  );
};

const LAYOUT_CONFIG = Meteor.settings.public.layout;

export default withTracker(({ isPresenter }) => {
  const inEchoTest = Session.get('inEchoTest');
  const startDate = getFromUserSettings('bld_external_video_date', null);
  const videoUrl = getFromUserSettings('bld_external_video_url', null);
  
  // Calculate seconds elapsed since startDate
  let startTime = 0;
  if (startDate) {
    const startDateObj = new Date(startDate);
    startTime = Math.floor(startDateObj.getTime() / 1000); // Convert to seconds
    console.log('Start time debug:', {
      startDate,
      startDateObj,
      startTime,
    });
  }

  return {
    inEchoTest,
    isPresenter,
    startTime,
    videoUrl,
    isUsingAudio: AudioService.isUsingAudio(),
  };
})(ExternalBilduinContainer);
