/**
 * Locale bundles for the NB Search settings card. `zh` is the source of truth
 * for the key set; `en` is typed against the same union, so a missing or extra
 * key in either bundle is a compile error.
 */

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** NB Search plugin card copy. */
    'nb-search': NbSearchLocaleKey
  }
}

/** Locale keys this card renders. */
export type NbSearchLocaleKey =
  | 'title' | 'description' | 'expand' | 'collapse'
  | 'configFile' | 'configFileHint' | 'configFileExample'
  | 'defaultSearchLane' | 'defaultSearchLaneHint' | 'defaultSearchLaneExample'
  | 'defaultFetchPipeline' | 'defaultFetchPipelineHint' | 'defaultFetchPipelineExample'
  | 'overridden' | 'reset' | 'inherits'
  | 'readOnly' | 'unsaved'
  | 'save' | 'saving' | 'discard' | 'reload' | 'reloading'
  | 'saved' | 'saveRejected' | 'saveConflict'

/** Simplified Chinese copy. */
export const zh: Record<NbSearchLocaleKey, string> = {
  title: 'NB Search',
  description: '决定 SDK 从哪里读取配置，以及默认的检索通道与 URL 读取流水线。留空即沿用 SDK 自身。',
  expand: '展开设置',
  collapse: '收起设置',
  configFile: 'SDK 配置文件路径',
  configFileHint: '读取配置的 JSON 文件路径，使用完整路径。留空则沿用 SDK 的默认解析。',
  configFileExample: '例如 C:/Users/you/nb-search/config.json',
  defaultSearchLane: '默认搜索通道',
  defaultSearchLaneHint: 'nb_search 未指定通道时使用的 lane。留空则沿用 SDK 配置；无默认通道时必须显式指定。',
  defaultSearchLaneExample: '例如 github.repositories',
  defaultFetchPipeline: '默认 URL 读取流水线',
  defaultFetchPipelineHint: 'nb_fetch 读取 URL 时使用的流水线。留空则沿用 SDK 配置。',
  defaultFetchPipelineExample: '例如 direct.fetch',
  overridden: '已覆盖',
  reset: '恢复默认',
  inherits: '当前沿用 {value}',
  readOnly: '本部署的设置为只读，无法保存。',
  unsaved: '未保存',
  save: '保存',
  saving: '保存中…',
  discard: '放弃修改',
  reload: '重新载入',
  reloading: '载入中…',
  saved: '已保存，NB Search 将在下一次工具调用时重建。',
  saveRejected: '未保存：',
  saveConflict: '设置已被其他来源更新（本地 {expected} → 主机 {actual}）。你的修改已保留：再次保存会按主机当前值重试；重新载入会放弃本地修改并显示主机的值。',
}

/** English copy. */
export const en: Record<NbSearchLocaleKey, string> = {
  title: 'NB Search',
  description: 'Where the SDK reads its configuration, and which search lane and URL fetch pipeline it prefers. Blank inherits the SDK.',
  expand: 'Show settings',
  collapse: 'Hide settings',
  configFile: 'SDK config file',
  configFileHint: 'Path to the JSON file NB Search reads, as a full path. Blank uses the SDK default resolution.',
  configFileExample: 'e.g. C:/Users/you/nb-search/config.json',
  defaultSearchLane: 'Default search lane',
  defaultSearchLaneHint: 'The lane nb_search uses when you name none. Blank inherits the SDK configuration; with no configured default a lane must be named.',
  defaultSearchLaneExample: 'e.g. github.repositories',
  defaultFetchPipeline: 'Default URL fetch pipeline',
  defaultFetchPipelineHint: 'The pipeline nb_fetch uses to read a URL. Blank inherits the SDK configuration.',
  defaultFetchPipelineExample: 'e.g. direct.fetch',
  overridden: 'Overridden',
  reset: 'Reset to default',
  inherits: 'currently {value}',
  readOnly: 'This deployment stores settings read-only, so this card cannot save.',
  unsaved: 'Unsaved',
  save: 'Save',
  saving: 'Saving…',
  discard: 'Discard',
  reload: 'Reload',
  reloading: 'Reloading…',
  saved: 'Saved. NB Search rebuilds on the next tool call.',
  saveRejected: 'Not saved: ',
  saveConflict: 'These settings were updated elsewhere (local {expected} → host {actual}). Your edits are kept: save again to re-apply them at what the host now holds; reload drops them and shows the host values.',
}
