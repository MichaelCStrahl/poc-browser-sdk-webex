import { init as initWebex } from 'webex';

// Initialize the SDK and make it available to the window
const webex = (window.webex = initWebex({
  credentials: {
    // Access Token Test in: https://developer.webex.com/docs/getting-started#accounts-and-authentication
    access_token: 'token' 
  }
}));

webex.meetings.register()
  .catch((err) => {
    console.error(err);
    alert(err);
    throw err;
  });

function bindMeetingEvents(meeting) {
  meeting.on('error', (err) => {
    console.error(err);
  });

  // Handle media streams changes to ready state
  meeting.on('media:ready', (media) => {
    if (!media) {
      return;
    }
    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = media.stream;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = media.stream;
    }
  });

  // Handle media streams stopping
  meeting.on('media:stopped', (media) => {
    // Remove media streams
    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = null;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = null;
    }
  });

  // Of course, we'd also like to be able to leave the meeting:
  document.getElementById('hangup').addEventListener('click', () => {
    meeting.leave();
  });
}

// Join the meeting and add media through joinWithMedia method.
async function joinMeeting(meeting) {

    const microphoneStream = await webex.meetings.mediaHelpers.createMicrophoneStream({
      echoCancellation: true,
      noiseSuppression: true,
    });

    const cameraStream = await webex.meetings.mediaHelpers.createCameraStream({ width: 640, height: 480 });
    document.getElementById('self-view').srcObject=cameraStream.outputStream;

    const meetingOptions = {
      mediaOptions: {
        allowMediaInLobby: true,
        shareAudioEnabled: false,
        shareVideoEnabled: false,
        localStreams:{
          camera:cameraStream,
          microphone: microphoneStream
        },      
      },
    };

    await meeting.joinWithMedia(meetingOptions);

  } 

document.getElementById('destination').addEventListener('submit', (event) => {
  // again, we don't want to reload when we try to join
  event.preventDefault();

  const destination = document.getElementById('invitee').value;

  return webex.meetings.create(destination).then((meeting) => {
    // Call our helper function for binding events to meetings
    bindMeetingEvents(meeting);

    return joinMeeting(meeting);
  })
  .catch((error) => {
    // Report the error
    console.error(error);
  });
});