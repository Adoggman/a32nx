import { AtsuFmsMessages, AtsuFmsMessageSyncType } from '@atsu/common/databus';
import { AtsuStatusCodes, FansMode } from '@atsu/common/index';
import {
    AtisMessage,
    AtisType,
    AtsuMessage,
    AtsuMessageSerializationFormat,
    CpdlcMessage,
    DclMessage,
    FreetextMessage,
    MetarMessage,
    OclMessage,
    TafMessage,
    WeatherMessage,
} from '@atsu/common/messages';
import { AutopilotData, EnvironmentData, FlightStateData } from '@atsu/common/types';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanManager } from '@fmgc/index';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { FlightPlanSync } from './flightplansync';

export class FmsClient {
    private readonly bus: EventBus;

    private readonly flightPlan: FlightPlanSync;

    private readonly publisher: Publisher<AtsuFmsMessages>;

    private readonly subscriber: EventSubscriber<AtsuFmsMessages>;

    private requestId: number = 0;

    private atisAutoUpdates: string[] = [];

    private atcAtisReports: Map<string, AtisMessage[]>;

    private atisReportsPrintActive: boolean = false;

    private atcStationStatus: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean };

    private atcMessagesBuffer: CpdlcMessage[] = [];

    private atcMonitoredMessages: CpdlcMessage[] = [];

    private aocUplinkMessages: AtsuMessage[] = [];

    private aocDownlinkMessages: AtsuMessage[] = [];

    private automaticPositionReportIsActive: boolean = false;

    private fms: any = null;

    constructor(fms: any, flightPlanManager: FlightPlanManager, flightPhaseManager: FlightPhaseManager) {
        this.atcStationStatus.mode = FansMode.FansNone;
        this.fms = fms;

        this.bus = new EventBus();
        this.publisher = this.bus.getPublisher<AtsuFmsMessages>();
        this.subscriber = this.bus.getSubscriber<AtsuFmsMessages>();

        this.subscriber.on('activeAtisAutoUpdates').handle((airports) => this.atisAutoUpdates = airports);
        this.subscriber.on('atcAtisReports').handle((reports) => this.atcAtisReports = reports);
        this.subscriber.on('printAtisReportsPrint').handle((active) => this.atisReportsPrintActive = active);
        this.subscriber.on('atcStationStatus').handle((status) => this.atcStationStatus = status);
        this.subscriber.on('aocUplinkMessages').handle((messages) => this.aocUplinkMessages = messages);
        this.subscriber.on('aocDownlinkMessages').handle((messages) => this.aocDownlinkMessages = messages);
        this.subscriber.on('atcMessages').handle((messages) => this.atcMessagesBuffer = messages);
        this.subscriber.on('monitoredMessages').handle((messages) => this.atcMonitoredMessages = messages);
        this.subscriber.on('automaticPositionReportActive').handle((active) => this.automaticPositionReportIsActive = active);

        this.flightPlan = new FlightPlanSync(this.bus, flightPlanManager, flightPhaseManager);
    }

    public maxUplinkDelay: number = -1;

    public modificationMessage: CpdlcMessage = null;

    private synchronizeMessage(message: AtsuMessage, type: AtsuFmsMessageSyncType): number {
        const requestId = this.requestId++;

        if (message instanceof AtisMessage) {
            this.publisher.pub('synchronizeAtisMessage', {
                type,
                requestId,
                message: message as AtisMessage,
            });
        } else if (message instanceof CpdlcMessage) {
            this.publisher.pub('synchronizeCpdlcMessage', {
                type,
                requestId,
                message: message as CpdlcMessage,
            });
        } else if (message instanceof DclMessage) {
            this.publisher.pub('synchronizeDclMessage', {
                type,
                requestId,
                message: message as DclMessage,
            });
        } else if (message instanceof FreetextMessage) {
            this.publisher.pub('synchronizeFreetextMessage', {
                type,
                requestId,
                message: message as FreetextMessage,
            });
        } else if (message instanceof MetarMessage) {
            this.publisher.pub('synchronizeMetarMessage', {
                type,
                requestId,
                message: message as MetarMessage,
            });
        } else if (message instanceof OclMessage) {
            this.publisher.pub('synchronizeOclMessage', {
                type,
                requestId,
                message: message as OclMessage,
            });
        } else if (message instanceof TafMessage) {
            this.publisher.pub('synchronizeTafMessage', {
                type,
                requestId,
                message: message as TafMessage,
            });
        }

        return requestId;
    }

    public sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.synchronizeMessage(message, AtsuFmsMessageSyncType.SendMessage);

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestAtsuStatusCode').handle((response) => {
                if (response.requestId === requestId) resolve(response.code);
            });
        });
    }

    public messageRead(uid: number): void {
        this.publisher.pub('messageRead', uid);
    }

    public printMessage(message: AtsuMessage): void {
        const text = message.serialize(AtsuMessageSerializationFormat.Printer);
        this.fms.printPage(text.split('\n'));
    }

    public removeMessage(uid: number): void {
        this.publisher.pub('removeMessage', uid);
    }

    public receiveAtis(airport: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, AtisMessage]> {
        return new Promise<[AtsuStatusCodes, AtisMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestAtis', { icao: airport, type, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestSentToGround').handle((id) => {
                if (id === requestId) sentCallback();
            });
            subscriber.on('atisResponse').handle((response) => resolve(response));
        });
    }

    public receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestWeather', { icaos, requestMetar, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestSentToGround').handle((id) => {
                if (id === requestId) sentCallback();
            });
            subscriber.on('weatherResponse').handle((response) => resolve(response));
        });
    }

    public registerMessages(messages: AtsuMessage[]): void {
        const requestId = this.requestId++;

        if (messages[0] instanceof AtisMessage) {
            this.publisher.pub('registerAtisMessages', { requestId, messages: messages as AtisMessage[] });
        } else if (messages[0] instanceof CpdlcMessage) {
            this.publisher.pub('registerCpdlcMessages', { requestId, messages: messages as CpdlcMessage[] });
        } else if (messages[0] instanceof DclMessage) {
            this.publisher.pub('registerDclMessages', { requestId, messages: messages as DclMessage[] });
        } else if (messages[0] instanceof OclMessage) {
            this.publisher.pub('registerOclMessages', { requestId, messages: messages as OclMessage[] });
        } else if (messages[0] instanceof WeatherMessage) {
            this.publisher.pub('registerWeatherMessages', { requestId, messages: messages as WeatherMessage[] });
        }
    }

    public atisAutoUpdateActive(icao: string): boolean {
        return this.atisAutoUpdates.findIndex((airport) => icao === airport) !== -1;
    }

    public deactivateAtisAutoUpdate(icao: string): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('deactivateAtisAutoUpdate', { icao, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('genericRequestResponse').handle((id) => {
                if (id === requestId) resolve();
            });
        });
    }

    public activateAtisAutoUpdate(icao: string): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('activateAtisAutoUpdate', { icao, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('genericRequestResponse').handle((id) => {
                if (id === requestId) resolve();
            });
        });
    }

    public atisReports(icao: string): AtisMessage[] {
        if (this.atcAtisReports.has(icao)) {
            return this.atcAtisReports.get(icao);
        }
        return [];
    }

    public printAtisReportsPrint(): boolean {
        return this.atisReportsPrintActive;
    }

    public togglePrintAtisReports(): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('togglePrintAtisReportsPrint', requestId);

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('genericRequestResponse').handle((id) => {
                if (id === requestId) resolve();
            });
        });
    }

    public currentStation(): string {
        return this.atcStationStatus.current;
    }

    public fansMode(): FansMode {
        return this.atcStationStatus.mode;
    }

    public nextStationNotificationTime(): number {
        return this.atcStationStatus.notificationTime;
    }

    public nextStation(): string {
        return this.atcStationStatus.next;
    }

    public flightNumber(): string {
        return SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
    }

    public logonInProgress(): boolean {
        return this.atcStationStatus.logonInProgress;
    }

    public logon(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogon', { station: callsign, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestAtsuStatusCode').handle((response) => {
                if (response.requestId === requestId) resolve(response.code);
            });
        });
    }

    public logoff(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogoff', requestId);

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestAtsuStatusCode').handle((response) => {
                if (response.requestId === requestId) resolve(response.code);
            });
        });
    }

    public isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('remoteStationAvailable', { station: callsign, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('requestAtsuStatusCode').handle((response) => {
                if (response.requestId === requestId) resolve(response.code);
            });
        });
    }

    public updateMessage(message: CpdlcMessage): void {
        if (this.modificationMessage !== null && message.UniqueMessageID === this.modificationMessage.UniqueMessageID) {
            this.modificationMessage = null;
        }

        this.publisher.pub('synchronizeCpdlcMessage', {
            type: AtsuFmsMessageSyncType.UpdateMessage,
            requestId: this.requestId++,
            message: message as DclMessage,
        });
    }

    public aocInputMessages(): AtsuMessage[] {
        return this.aocUplinkMessages;
    }

    public aocOutputMessages(): AtsuMessage[] {
        return this.aocDownlinkMessages;
    }

    public atcMessages(): CpdlcMessage[] {
        return this.atcMessagesBuffer;
    }

    public monitoredMessages(): CpdlcMessage[] {
        return this.atcMonitoredMessages;
    }

    public cleanupAtcMessages(): void {
        this.publisher.pub('cleanupAtcMessages', true);
    }

    public setMaxUplinkDelay(delay: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('setMaxUplinkDelay', { delay, requestId });

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('genericRequestResponse').handle((id) => {
                if (id === requestId) resolve();
            });
        });
    }

    public automaticPositionReportActive(): boolean {
        return this.automaticPositionReportIsActive;
    }

    public toggleAutomaticPositionReport(): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('toggleAutomaticPositionReport', requestId);

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('genericRequestResponse').handle((id) => {
                if (id === requestId) resolve();
            });
        });
    }

    public receivePositionReportData(): Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }> {
        return new Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestPositionReport', requestId);

            const subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
            subscriber.on('positionReport').handle((response) => {
                if (response.requestId === requestId) resolve(response.data);
            });
        });
    }

    public resetAtisAutoUpdate(): void {
        this.publisher.pub('resetAtisAutoUpdate', true);
    }
}
