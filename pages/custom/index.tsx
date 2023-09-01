import { formatChatMessageLinks, LiveKitRoom, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  RoomConnectOptions,
  Room,
  RoomOptions,
  VideoPresets,
} from 'livekit-client';
import { useRouter } from 'next/router';
import { DebugMode } from '../../lib/Debug';
import { decodePassphrase } from '../../lib/client-utils';
import { useMemo } from 'react';

export default function CustomRoomConnection() {
  const router = useRouter();
  const { liveKitUrl, token } = router.query;

  const hash = typeof window !== 'undefined' && window.location.hash;
  const worker =
    typeof window !== 'undefined' &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const keyProvider = new ExternalE2EEKeyProvider();

  const e2eeEnabled = !!(hash && worker);

  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: false,
        dtx: false,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);
  if (e2eeEnabled) {
    keyProvider.setKey(decodePassphrase(hash.substring(1)));
    room.setE2EEEnabled(true);
  }

  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: false,
    };
  }, []);

  if (typeof liveKitUrl !== 'string') {
    return <h2>Missing LiveKit URL</h2>;
  }
  if (typeof token !== 'string') {
    return <h2>Missing LiveKit token</h2>;
  }

  return (
    <main data-lk-theme="default">
      {liveKitUrl && (
        <LiveKitRoom
          room={room}
          token={token}
          connectOptions={connectOptions}
          serverUrl={liveKitUrl}
          audio={true}
          video={true}
        >
          <VideoConference chatMessageFormatter={formatChatMessageLinks} />
          <DebugMode logLevel={LogLevel.info} />
        </LiveKitRoom>
      )}
    </main>
  );
}
