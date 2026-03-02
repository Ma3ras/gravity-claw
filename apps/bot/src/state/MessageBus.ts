import * as fs from 'fs';
import * as path from 'path';
import { MessageBusEvent } from '../types/index.js';
import { randomUUID } from 'crypto';

export class MessageBus {
    private busFilePath: string;
    private knownMessageIds = new Set<string>();

    constructor(workspacePath: string) {
        this.busFilePath = path.join(workspacePath, 'message_bus.json');
        if (!fs.existsSync(this.busFilePath)) {
            // initialize empty bus
            fs.writeFileSync(this.busFilePath, JSON.stringify([]), 'utf-8');
        } else {
            // Read existing to populate known IDs
            this.readMessages().forEach(m => this.knownMessageIds.add(m.id));
        }
    }

    public readMessages(): MessageBusEvent[] {
        try {
            return JSON.parse(fs.readFileSync(this.busFilePath, 'utf-8'));
        } catch {
            return [];
        }
    }

    public publish(from: string, to: string | undefined, content: string): void {
        const events = this.readMessages();
        const newEvent: MessageBusEvent = {
            id: randomUUID(),
            timestamp: Date.now(),
            from,
            to,
            content,
            resolved: false
        };
        events.push(newEvent);
        this.knownMessageIds.add(newEvent.id);
        fs.writeFileSync(this.busFilePath, JSON.stringify(events, null, 2), 'utf-8');
    }

    public watch(onNewMessage: (msg: MessageBusEvent) => void): fs.FSWatcher {
        // Debounce watch slightly
        let timeout: NodeJS.Timeout | null = null;
        return fs.watch(this.busFilePath, (eventType) => {
            if (eventType === 'change') {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const events = this.readMessages();
                    const newEvents = events.filter(e => !this.knownMessageIds.has(e.id));

                    for (const event of newEvents) {
                        this.knownMessageIds.add(event.id);
                        onNewMessage(event);
                    }
                }, 100);
            }
        });
    }
}
