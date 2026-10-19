import type { ModuleInstance } from './main.js'
import { MessageType, OSCString } from './constants.js'
import { getTargetHostPort } from './config.js'
import { OSCClient, OSCType } from 'ts-osc'
import { InputValue, Regex } from '@companion-module/base'

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		rec_start: {
			name: 'Start Recording',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.RecStart, self)
			},
		},

		rec_stop: {
			name: 'Stop Recording',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.RecStop, self)
			},
		},

		rec_toggle: {
			name: 'Toggle Recording',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.RecToggle, self)
			},
		},

		snapshot: {
			name: 'Take Snapshot',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.Snapshot, self)
			},
		},

		show_name: {
			name: 'Set Show Name',
			options: [
				{
					id: 'show_name',
					type: 'textinput',
					label: 'New Show Name',
					regex: Regex.SOMETHING,
				},
			],
			callback: async (event) => {
				sendAttributeMessage(MessageType.ShowName, self, event.options.show_name)
			},
		},

		show_num: {
			name: 'Set Show Number',
			options: [
				{
					id: 'show_num',
					type: 'number',
					label: 'New Show Number',
					default: 1,
					min: 1,
					max: 999,
				},
			],
			callback: async (event) => {
				sendAttributeMessage(MessageType.ShowNumber, self, event.options.show_num)
			},
		},

		show_num_plus: {
			name: 'Increment the Show Number by 1',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.ShowNumberPlus, self)
			},
		},

		show_num_minus: {
			name: 'Decrement the Show Number by 1',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.ShowNumberMinus, self)
			},
		},

		show_num_reset: {
			name: 'Reset the Show Number to 1',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.ShowNumberReset, self)
			},
		},

		composition: {
			name: 'Recall a Composition',
			options: [
				{
					id: 'comp_num',
					type: 'number',
					label: 'Composition Number',
					default: 1,
					min: 1,
					max: 99,
				},
			],
			callback: async (event) => {
				sendAttributeMessage(MessageType.Composition, self, event.options.comp_num)
			},
		},

		sys_quit: {
			name: 'Quit Vor Software',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.SysQuit, self)
			},
		},

		sys_shut: {
			name: 'Shutdown Vor Server',
			options: [],
			callback: async () => {
				sendSimpleMessage(MessageType.SysShutdown, self)
			},
		},
	})
}

function sendSimpleMessage(msgType: MessageType, instance: ModuleInstance) {
	const address = constructAddress(msgType, instance.config.osc_id)
	const { host, port } = getTargetHostPort(instance.config)

	const client = new OSCClient(host, port)

	client.send(address, OSCType.Null, null)

	instance.log('debug', `Sent ${address} to ${host}:${port}`)
}

function sendAttributeMessage(
	msgType: MessageType,
	instance: ModuleInstance,
	value: string | number | InputValue | undefined,
) {
	const address = constructAddress(msgType, instance.config.osc_id)
	const { host, port } = getTargetHostPort(instance.config)

	const client = new OSCClient(host, port)

	if (typeof value === 'string') {
		client.send(address, OSCType.String, value)
	} else if (typeof value === 'number') {
		client.send(address, OSCType.Integer, value)
	}

	instance.log('debug', `Sent ${address} to ${host}:${port} with attribute: ${value} (as a ${typeof value})`)
}

function constructAddress(msgType: MessageType, osc_id: number) {
	const oscIDInclude = osc_id > 1 ? osc_id + '/' : ''

	switch (msgType) {
		case MessageType.RecStart:
			return OSCString.BASE + oscIDInclude + OSCString.REC_START

		case MessageType.RecStop:
			return OSCString.BASE + oscIDInclude + OSCString.REC_STOP

		case MessageType.RecToggle:
			return OSCString.BASE + oscIDInclude + OSCString.REC_TOGGLE

		case MessageType.Snapshot:
			return OSCString.BASE + oscIDInclude + OSCString.SNAPSHOT

		case MessageType.ShowName:
			return OSCString.BASE + oscIDInclude + OSCString.SHOW_NAME

		case MessageType.ShowNumber:
			return OSCString.BASE + oscIDInclude + OSCString.SHOW_NUM

		case MessageType.ShowNumberPlus:
			return OSCString.BASE + oscIDInclude + OSCString.SHOW_NUM_UP

		case MessageType.ShowNumberMinus:
			return OSCString.BASE + oscIDInclude + OSCString.SHOW_NUM_DN

		case MessageType.ShowNumberReset:
			return OSCString.BASE + oscIDInclude + OSCString.SHOW_NUM_RST

		case MessageType.Composition:
			return OSCString.BASE + oscIDInclude + OSCString.COMP

		case MessageType.SysQuit:
			return OSCString.BASE + oscIDInclude + OSCString.SYS_QUIT

		case MessageType.SysShutdown:
			return OSCString.BASE + oscIDInclude + OSCString.SYS_SHUT
	}

	throw Error('Unknown Message Type!')
}
