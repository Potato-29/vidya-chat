import "./App.css";
import { useState, useRef } from "react";
import { pc } from "./configs/rtc-connections";
import { firestore } from "./configs/firebase";
function App() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const callInputRef = useRef(null);
  const handleLocalStream = () => {
    setLocalStream(
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
    );

    setRemoteStream(new MediaStream());
    pc.ontrack = (event) => {
      setRemoteStream(
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        })
      );
    };

    localStreamRef.current.srcObject = localStream;
    remoteStreamRef.current.srcObject = remoteStream;
  };

  const handleCreateCall = async () => {
    const callDoc = firestore.collection("calls").doc();
    const offerCollection = callDoc.collection("offers");
    const answerCollection = callDoc.collection("answers");

    callInputRef.current.value = callDoc.id;

    pc.onicecandidate = (event) => {
      event.candidate && offerCollection.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    await offerCollection.add({
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    });

    callDoc.onSnapShot((snapshot) => {
      const data = snapshot.data();
      if (!pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription);
      }
    });

    answerCollection.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate);
        }
      });
    });
  };

  const handleAnswer = async () => {
    const callId = callInputRef.current.value;
    const callDoc = firestore.collection("calls").doc(callId);
    const answerCandidates = callDoc.collection("answerCandidates");
    const offerCandidates = callDoc.collection("offerCandidates");

    pc.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          pc.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };
  return (
    <>
      <h2>1. Start your Webcam</h2>
      <div className="videos">
        <span>
          <h3>Local Stream</h3>
          <video ref={localStreamRef} autoPlay playsInline></video>
        </span>
        <span>
          <h3>Remote Stream</h3>
          <video ref={remoteStreamRef} autoPlay playsInline></video>
        </span>
      </div>

      <button id="webcamButton" onClick={handleLocalStream}>
        Start webcam
      </button>
      <h2>2. Create a new Call</h2>
      <button id="callButton" onClick={handleCreateCall} disabled>
        Create Call (offer)
      </button>

      <h2>3. Join a Call</h2>
      <p>Answer the call from a different browser window or device</p>

      <input ref={callInputRef} />
      <button id="answerButton" onClick={handleAnswer} disabled>
        Answer
      </button>

      <h2>4. Hangup</h2>

      <button id="hangupButton" disabled>
        Hangup
      </button>

      <script type="module" src="/main.js"></script>
    </>
  );
}

export default App;
