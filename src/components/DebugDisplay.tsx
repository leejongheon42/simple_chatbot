import {useCallback, useRef} from 'react';
import {BotLLMTextData, Participant, RTVIEvent, TranscriptData, TransportState,} from 'realtime-ai';
import {useRTVIClient, useRTVIClientEvent} from 'realtime-ai-react';
import './DebugDisplay.css';

enum MessageType {
    LOG = 'log',
    DIALOG = 'dialog'
}

export function DebugDisplay() {
    const debugLogRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const client = useRTVIClient();

    const log = useCallback((message: string, messageType: MessageType) => {
        if (!debugLogRef || !debugLogRef.current) return;
        if (!dialogRef.current) return;

        const entry = document.createElement('div');
        entry.textContent = `${new Date().toISOString()} - ${message}`;

        if (messageType === MessageType.LOG) {
            // Add styling based on message type
            if (message.startsWith('User: ')) {
                entry.style.color = '#2196F3'; // blue for user
            } else if (message.startsWith('Bot: ')) {
                entry.style.color = '#4CAF50'; // green for bot
            }

            debugLogRef.current.appendChild(entry);
            debugLogRef.current.scrollTop = debugLogRef.current.scrollHeight;
        }
        else {
            // Add styling based on message type
            if (message.startsWith('User: ')) {
                entry.style.color = '#2196F3'; // blue for user
            } else if (message.startsWith('Bot: ')) {
                entry.style.color = '#4CAF50'; // green for bot
            }

            dialogRef.current.appendChild(entry);
            dialogRef.current.scrollTop = dialogRef.current.scrollHeight;
        }

    }, []);

    // Log transport state changes
    useRTVIClientEvent(
        RTVIEvent.TransportStateChanged,
        useCallback(
            (state: TransportState) => {
                log(`Transport state changed: ${state}`, MessageType.LOG);
            },
            [log]
        )
    );

    // Log bot connection events
    useRTVIClientEvent(
        RTVIEvent.BotConnected,
        useCallback(
            (participant?: Participant) => {
                log(`Bot connected: ${JSON.stringify(participant)}`, MessageType.LOG);
            },
            [log]
        )
    );

    useRTVIClientEvent(
        RTVIEvent.BotDisconnected,
        useCallback(
            (participant?: Participant) => {
                log(`Bot disconnected: ${JSON.stringify(participant)}`, MessageType.LOG);
            },
            [log]
        )
    );

    // Log track events
    useRTVIClientEvent(
        RTVIEvent.TrackStarted,
        useCallback(
            (track: MediaStreamTrack, participant?: Participant) => {
                log(
                    `Track started: ${track.kind} from ${participant?.name || 'unknown'}`, MessageType.LOG
                );
            },
            [log]
        )
    );

    useRTVIClientEvent(
        RTVIEvent.TrackedStopped,
        useCallback(
            (track: MediaStreamTrack, participant?: Participant) => {
                log(
                    `Track stopped: ${track.kind} from ${participant?.name || 'unknown'}`, MessageType.LOG
                );
            },
            [log]
        )
    );

    // Log bot ready state and check tracks
    useRTVIClientEvent(
        RTVIEvent.BotReady,
        useCallback(() => {
            log(`Bot ready`,MessageType.LOG);

            if (!client) return;

            const tracks = client.tracks();
            log(
                `Available tracks: ${JSON.stringify({
                    local: {
                        audio: !!tracks.local.audio,
                        video: !!tracks.local.video,
                    },
                    bot: {
                        audio: !!tracks.bot?.audio,
                        video: !!tracks.bot?.video,
                    },
                })}`,
                MessageType.LOG
            );
        }, [client, log])
    );

    // Log transcripts
    useRTVIClientEvent(
        RTVIEvent.UserTranscript,
        useCallback(
            (data: TranscriptData) => {
                // Only log final transcripts
                if (data.final) {
                    log(`User: ${data.text}`, MessageType.DIALOG);
                }
            },
            [log]
        )
    );

    useRTVIClientEvent(
        RTVIEvent.BotTranscript,
        useCallback(
            (data: BotLLMTextData) => {
                log(`Bot: ${data.text}`, MessageType.DIALOG);
            },
            [log]
        )
    );

    return (
        <div className="flex debug-panel">
            <h3>서버 로그</h3>
            <div ref={debugLogRef} className="debug-log"/>
            <h3>대화 이력</h3>
            <div ref={dialogRef} className="debug-log"/>
        </div>
    );
}
