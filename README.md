# StreamElements Bullet Chat Widget by H37iX & Yuuki

A collaboration with Yukki to build a customizable bullet chat widget for StreamElements. This widget displays chat messages scrolling across the screen with various animation and styling options. Created after Yukki noted the lack of a fully functional StreamElements overlay for bullet-style chat. We were unable to quickly find a free/shared version of the code needed to make this work so we are posting it here for others who may want to use it. 

## Example

https://github.com/H37IX/Yuuki-Bullet-Chat/blob/main/H37-Bullet-Chat-Example.mp4

## Features

- **Direction Control**: 
  - Choose whether messages come from the left side, right side, or randomly from both sides
- **Animation Controls**:
  - Speed: Control how fast messages move across the screen
  - Duration: How long messages stay visible
  - Fade Out: Toggle whether messages fade out at the end
  - Fade Duration: Control how long the fade out takes
- **Styling Options**:
  - Font Family: Select from Google Fonts
  - Font Size: Customize the text size
  - Username Color: Custom color for usernames (with opacity control)
  - Message Color: Custom color for message text (with opacity control)
  - Background Color: Optional message background with customizable color and opacity

## Installation

1. **Create a New Custom Widget**:
   - Go to your StreamElements dashboard
   - Navigate to "My Overlays"
   - Open an existing overlay or create a new one
   - Click the "+" button to add a new widget
   - Select "Custom Widget"

2. **Add the Required Files**:
   - In the Custom Widget Editor, you'll see tabs for HTML, CSS, JS, FIELDS, and DATA
   - Copy the contents of each file in this repository to the corresponding tab:
     - `html.html` → HTML tab
     - `styles.css` → CSS tab
     - `script.js` → JS tab
     - `fields.json` → FIELDS tab

3. **Save and Add to Overlay**:
   - Click "Done" to save the widget
   - Resize and position the widget as needed in your overlay
   - Make sure to hit SAVE after each change you want to see in OBS or your overlay preview window in a browser

## Customization Options

### Message Direction
- **Left → Right**: Messages appear from the left side and move right
- **Right → Left**: Messages appear from the right side and move left
- **Both (Random)**: Messages randomly appear from either side

### Animation Settings
- **Speed**: Controls how fast messages move across the screen (1-50 pixels per frame)
- **Duration**: How long messages stay visible before disappearing (1-10 seconds)
- **Fade Out**: When enabled, messages fade out at the end of their duration
- **Fade Time**: Controls how long the fade out animation takes (0.1-5 seconds)

### Styling Options
- **Message Font**: Choose from hundreds of Google Fonts
- **Font Size**: Set the text size (10-100 pixels)
- **Username Color**: Custom color for usernames with opacity control
- **Chat Text Color**: Custom color for message text with opacity control
- **Background Color**: Custom color for message background with opacity control

## Extra Features Added

### Message Spacing
- Messages are automatically spaced vertically to prevent overlap
- Minimum spacing between messages: 50 pixels

### Message Deletion
- Supports moderator message deletion
- Automatically removes messages when deleted by moderators
- Handles both single message deletion and user message deletion (timeout/ban)

## Troubleshooting

- If messages aren't appearing, check your browser console for any error messages
- Make sure your chat is connected and working in StreamElements
- Try refreshing the widget if settings changes aren't taking effect and be sure to save any changes in stream elements before trying to preview them

## Need Help?

For more information on custom widgets in StreamElements, refer to:
- [StreamElements Custom Widget Documentation](https://docs.streamelements.com/overlays/custom-widget)
- [StreamElements Custom Widget Events](https://docs.streamelements.com/overlays/custom-widget-events)
- [StreamElements Widget Structure](https://docs.streamelements.com/overlays/widget-structure)


-H37🧬
