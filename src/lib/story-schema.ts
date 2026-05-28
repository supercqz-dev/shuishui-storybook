export const STORY_JSON_SCHEMA = {
  name: 'story_book',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['title', 'subtitle', 'theme', 'moral', 'pages'],
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
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
              maxItems: 2,
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
