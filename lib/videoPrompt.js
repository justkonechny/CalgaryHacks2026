/**
 * Micro-lecture background video prompt template for Sora.
 * Single substitution: TOPIC.
 */

const MICRO_LECTURE_VIDEO_PROMPT_TEMPLATE = `You are generating a background video for an educational micro-lecture.

Topic:
{{TOPIC}}

VIDEO REQUIREMENTS:
- Generate exactly 1 video.
- Duration must be exactly 10 seconds.
- Format must be vertical (9:16).

CONTENT REQUIREMENTS:
- The visuals must clearly relate to the topic.
- The scene should visually represent the concept in a general way.
- Avoid literal narration-style storytelling.
- Avoid complex or busy compositions.
- The video must support spoken narration layered on top.

TEXT RESTRICTIONS:
- Do not use text in the video.
- Text is permitted only when the concept inherently requires visual representation of equations or symbolic notation.
- If text is used, it must be minimal and visually secondary.
- No subtitles.
- No captions.
- No UI elements.
- No logos.
- No watermarks.

LOOPING REQUIREMENTS:
- The video must loop seamlessly.
- The first and last frames must visually align.
- No abrupt cuts or transitions.

STYLE:
- Short-form social media aesthetic.
- Engaging, colorful, visually interesting.
- Smooth, intentional motion.
- Strong visual clarity and subject focus.
- The visuals must complement narration, not compete with it.

OUTPUT:
Return exactly one 10-second vertical (9:16) video file.
`;

const TOPIC_PLACEHOLDER = "{{TOPIC}}";

/**
 * Build the full micro-lecture background video prompt for Sora.
 * @param {string} topic - The lesson/concept topic to inject.
 * @returns {string} The prompt with topic substituted.
 */
export function buildMicroLectureVideoPrompt(topic) {
  const safeTopic = typeof topic === "string" ? topic.trim() : "";
  return MICRO_LECTURE_VIDEO_PROMPT_TEMPLATE.replace(
    TOPIC_PLACEHOLDER,
    safeTopic
  );
}
