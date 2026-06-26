#!/bin/bash
set -e

API=http://localhost:3000/api
EMAIL=teacher@gmail.com
PASSWORD=12345678

echo "🔐 Logging in..."
LOGIN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo "$LOGIN" | jq -r '.accessToken')
echo "   Token: ${TOKEN:0:30}..."

echo ""
echo "📚 Creating course..."
COURSE=$(curl -s -X POST $API/courses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Past Simple — Foundations",
    "description": "Learn how to talk about past events in English. This course covers Past Simple tense for regular and irregular verbs with plenty of practice.",
    "category": "GRAMMAR",
    "level": "A2"
  }')

COURSE_ID=$(echo "$COURSE" | jq -r '.id')
echo "   Course ID: $COURSE_ID"

echo ""
echo "📖 Creating lesson 1 (preview)..."
LESSON1=$(curl -s -X POST $API/courses/$COURSE_ID/lessons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Past Simple",
    "description": "What is Past Simple and when do we use it?",
    "content": "# Past Simple\n\nWe use the **Past Simple** tense to talk about completed actions in the past.\n\n## Examples\n\n- I **walked** to school yesterday.\n- She **lived** in Paris for 5 years.\n- They **played** football last weekend.\n\n## Regular vs Irregular\n\nRegular verbs add `-ed`:\n- walk → walked\n- play → played\n\nIrregular verbs change form:\n- go → went\n- eat → ate\n- see → saw",
    "isPreview": true
  }')

LESSON1_ID=$(echo "$LESSON1" | jq -r '.id')
echo "   Lesson 1 ID: $LESSON1_ID"

echo ""
echo "❓ Adding questions to lesson 1..."

# MULTIPLE_CHOICE
curl -s -X POST $API/lessons/$LESSON1_ID/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MULTIPLE_CHOICE",
    "prompt": "What is the past tense of \"go\"?",
    "payload": {
      "options": ["goed", "went", "gone", "going"],
      "correctIndex": 1
    },
    "explanation": "\"Go\" is irregular. Its past form is \"went\".",
    "points": 10
  }' > /dev/null
echo "   ✓ MCQ added"

# FILL_BLANK
curl -s -X POST $API/lessons/$LESSON1_ID/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "FILL_BLANK",
    "prompt": "Complete with the correct past form.",
    "payload": {
      "text": "Yesterday I ___ to the store.",
      "correctAnswers": ["went", "walked"],
      "caseSensitive": false
    },
    "explanation": "Both \"went\" and \"walked\" are accepted.",
    "points": 10
  }' > /dev/null
echo "   ✓ Fill blank added"

# DRAG_DROP
curl -s -X POST $API/lessons/$LESSON1_ID/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "DRAG_DROP",
    "prompt": "Arrange the words to form a correct sentence.",
    "payload": {
      "words": ["yesterday", "park", "to", "the", "I", "went"],
      "correctOrder": ["I", "went", "to", "the", "park", "yesterday"]
    },
    "explanation": "Subject + verb + place + time is a common English order.",
    "points": 15
  }' > /dev/null
echo "   ✓ Drag-drop added"

# SHORT_WRITING
curl -s -X POST $API/lessons/$LESSON1_ID/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "SHORT_WRITING",
    "prompt": "Describe what you did yesterday in 3-4 sentences. Use Past Simple.",
    "payload": {
      "prompt": "Describe what you did yesterday in 3-4 sentences. Use Past Simple.",
      "minWords": 15,
      "maxWords": 80
    },
    "explanation": "AI will give you feedback on grammar and vocabulary.",
    "points": 20
  }' > /dev/null
echo "   ✓ Short writing added"

echo ""
echo "📖 Creating lesson 2..."
LESSON2=$(curl -s -X POST $API/courses/$COURSE_ID/lessons \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Negative sentences in Past Simple",
    "description": "How to say what you did NOT do.",
    "content": "# Negatives in Past Simple\n\nTo make negative: **didn'\''t** + base form\n\n## Examples\n\n- I **didn'\''t go** to school yesterday.\n- She **didn'\''t eat** breakfast.\n- They **didn'\''t play** outside.\n\n⚠️ Notice: we use the base form (go, eat, play) after didn'\''t — NOT past form."
  }')

LESSON2_ID=$(echo "$LESSON2" | jq -r '.id')

# MATCH_PAIRS for lesson 2
curl -s -X POST $API/lessons/$LESSON2_ID/questions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "MATCH_PAIRS",
    "prompt": "Match each verb with its past form.",
    "payload": {
      "pairs": [
        { "left": "go", "right": "went" },
        { "left": "eat", "right": "ate" },
        { "left": "see", "right": "saw" },
        { "left": "have", "right": "had" }
      ]
    },
    "explanation": "These are common irregular verbs.",
    "points": 15
  }' > /dev/null
echo "   ✓ Match pairs added"

echo ""
echo "🚀 Publishing course..."
curl -s -X POST $API/courses/$COURSE_ID/publish \
  -H "Authorization: Bearer $TOKEN" > /dev/null

echo ""
echo "✅ Done!"
echo ""
echo "Course: Past Simple — Foundations"
echo "  ID:       $COURSE_ID"
echo "  Status:   PUBLISHED"
echo "  Lessons:  2 (1 preview, 1 regular)"
echo "  Questions: 5 (MCQ, FillBlank, DragDrop, ShortWriting, MatchPairs)"
echo ""
echo "Test in browser/curl:"
echo "  curl $API/courses"
echo ""