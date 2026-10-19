import { Regex, type SomeCompanionConfigField, InstanceStatus, DropdownChoice } from '@companion-module/base'
import type { ModuleInstance } from './main.js'
import { getLocalInterfaceIPs } from './discopixel/sACNReceiver/sacnReceiver.js'

export interface ModuleConfig {
	bonjour_host: string | undefined
	host: string
	port: number
	osc_id: number
	use_rec_sACN: boolean
	sacn_universe: number
	sacn_local_ip: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	const localIPChoices: DropdownChoice[] = []
	getLocalInterfaceIPs().forEach((elem) => localIPChoices.push({ id: elem, label: elem }))

	return [
		{
			type: 'bonjour-device',
			id: 'bonjour_host',
			label: 'Vor Instance',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Vor Host (IP or Hostname)',
			width: 8,
			default: '127.0.0.1',
			regex: Regex.HOSTNAME,
			isVisible: (options) => !options.bonjour_host,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Target Port',
			width: 4,
			default: 3049,
			min: 101,
			max: 65535,
			isVisible: (options) => !options.bonjour_host,
		},
		{
			type: 'number',
			id: 'osc_id',
			label: 'OSC Instance ID',
			width: 4,
			default: 1,
			min: 1,
			max: 999,
		},
		{
			type: 'checkbox',
			id: 'use_rec_sACN',
			label: 'Enable Recording Status sACN?',
			width: 12,
			default: false,
		},
		{
			type: 'number',
			id: 'sacn_universe',
			label: 'Recording Status sACN Universe',
			isVisible: (options) => !!options.use_rec_sACN,
			width: 6,
			min: 1,
			max: 65535,
			step: 1,
			default: 1,
		},
		{
			type: 'dropdown',
			id: 'sacn_local_ip',
			label: 'Local Interface to listen for sACN',
			isVisible: (options) => !!options.use_rec_sACN,
			width: 6,
			choices: localIPChoices,
			default: localIPChoices.length > 0 ? localIPChoices[0].id : '',
			allowCustom: true,
		},
	]
}

/**
 * Parse the effective host and port from the module config.
 * If a Bonjour device is selected, its value is "host:port" and takes priority.
 * Otherwise, the manual host and port fields are used.
 */
export function getTargetHostPort(config: ModuleConfig): { host: string; port: number } {
	if (config.bonjour_host) {
		const parts = config.bonjour_host.split(':')
		return {
			host: parts[0],
			port: parts.length > 1 ? Number(parts[1]) : config.port,
		}
	}
	return { host: config.host, port: config.port }
}

export function validateConfig(instance: ModuleInstance): boolean {
	const config = instance.config
	const { host, port } = getTargetHostPort(config)

	if (!host) {
		instance.updateStatus(InstanceStatus.BadConfig, 'IP or Hostname is mandatory!')
		return false
	}
	if (!port) {
		instance.updateStatus(InstanceStatus.BadConfig, 'Destination Port Num is mandatory!')
		return false
	}
	if (config.use_rec_sACN && !config.sacn_universe) {
		instance.updateStatus(
			InstanceStatus.BadConfig,
			'sACN Universe must be specified when sACN recording status is enabled!',
		)
		return false
	}

	instance.updateStatus(InstanceStatus.Ok)
	return true
}
