export const STORY_JSON_SCHEMA = {
  name: 'story_book',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'subtitle', 'theme', 'moral', 'pages'],
    properties: {
      // title 必须是简短、地道、纯真的英文绘本名(2-5 词),像经典英文童书书名。禁止中文、禁止拼音句子。
      title: { type: 'string', description: 'Short, natural, picture-book-style ENGLISH title, 2-5 words. e.g. "ShuiShui\'s Big Slide", "Brave Little ShuiShui". No Chinese, no pinyin sentences.' },
      // subtitle 是一行中文副标题(给家长一眼看懂),简短温暖。
      subtitle: { type: 'string', description: '一行简短的中文副标题(给家长看),温暖、概括故事,例如「水水第一次自己滑滑梯」。' },
      theme: { type: 'string' },
      moral: { type: 'string' },
      pages: {
        type: 'array',
        minItems: 8,
        maxItems: 15,
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'page',
            'narration',
            'dialogue',
            'shot',
            'emotion',
            'characters_in_scene',
            'scene_state',
            'composition_hint',
          ],
          properties: {
            page: { type: 'integer', minimum: 1, maximum: 15 },
            narration: { type: 'string' },
            dialogue: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['speaker', 'text'],
                properties: {
                  speaker: { type: 'string' },
                  text: { type: 'string' },
                },
              },
            },
            shot: {
              type: 'string',
              enum: ['wide', 'medium', 'close-up', 'extreme-close-up'],
            },
            emotion: { type: 'string' },
            characters_in_scene: {
              type: 'array',
              items: { type: 'string' },
            },
            scene_state: {
              type: 'object',
              additionalProperties: false,
              required: ['location', 'weather', 'time_of_day', 'props'],
              properties: {
                location: { type: 'string' },
                weather: { type: 'string' },
                time_of_day: { type: 'string' },
                props: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            composition_hint: { type: 'string' },
          },
        },
      },
    },
  },
} as const;
