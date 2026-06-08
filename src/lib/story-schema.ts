export const STORY_JSON_SCHEMA = {
  name: 'story_book',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'subtitle', 'theme', 'moral', 'pages'],
    properties: {
      // title 必须是简短、地道、纯真的英文绘本名(2-5 词),像经典英文童书书名。禁止中文、禁止拼音句子。
      // 不要在标题里出现主角名 "ShuiShui"——整套绘本都是她的故事,点名多余;用题材/动作/意象命名。
      title: { type: 'string', description: 'Short, natural, picture-book-style ENGLISH title, 2-5 words. e.g. "Rainy Day Splash", "The Big Slide", "Busy Little Ants". Do NOT include the protagonist name "ShuiShui" in the title. No Chinese, no pinyin sentences.' },
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
            'camera_angle',
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
            // shot 只控景别(远近),camera_angle 控机位角度,两者正交、组合出画面。
            shot: {
              type: 'string',
              enum: ['wide', 'medium', 'close-up', 'extreme-close-up'],
            },
            // 机位角度——与 shot(景别)正交。eye-level 平视 / high-angle 俯拍鸟瞰(建场,把场景结构铺开)/
            // low-angle 仰拍(显高大、勇敢)/ over-the-shoulder 过肩(跟随视角)/ from-behind 背身(带观众看向前方)/
            // three-quarter 三克分侧角(更立体)/ pov 主角视角(看到的东西本身)。
            camera_angle: {
              type: 'string',
              enum: [
                'eye-level',
                'high-angle',
                'low-angle',
                'over-the-shoulder',
                'from-behind',
                'three-quarter',
                'pov',
              ],
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
