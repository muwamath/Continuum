export interface SceneDefinition {
  id: string
  name: string
  actId: string
  actionIds: string[]
}

export interface ActDefinition {
  id: string
  name: string
  sceneIds: string[]
}

export const sceneDefinitions: Record<string, SceneDefinition> = {
  'act1-scene1': {
    id: 'act1-scene1',
    name: 'The Clearing',
    actId: 'act1',
    actionIds: ['harvest-berries', 'cut-wood', 'wooden-cart', 'wooden-hut', 'explore-the-area'],
  },
  'act1-scene2': {
    id: 'act1-scene2',
    name: 'The Wilderness',
    actId: 'act1',
    actionIds: ['harvest-berries', 'cut-wood', 'climb-the-mountain'],
  },
}

export const actDefinitions: Record<string, ActDefinition> = {
  'act1': {
    id: 'act1',
    name: 'Act 1',
    sceneIds: ['act1-scene1', 'act1-scene2'],
  },
}
