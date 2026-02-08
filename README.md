# 🕵️ Mr. White

A social deduction party game for 3+ players. Pass the phone around!

## How to Play

1. Add player names
2. Pass the phone - each player taps to see their secret role
3. **Civilians** all get the same word
4. **Undercover** gets a similar (but different) word
5. **Mr. White** gets NO word - has to bluff!

Each round:
- Give a ONE word clue about your word
- Vote to eliminate someone
- Find Mr. White before it's too late!

## Win Conditions

- 👥 **Civilians win** if they eliminate all imposters
- 🕵️ **Mr. White wins** if they survive OR guess the word when eliminated
- 🤫 **Undercover wins** if they outlast the civilians

## Setup

Just open `index.html` - no server needed!

## FTP Deployment

Set these GitHub secrets:
- `FTP_SERVER` - FTP host
- `FTP_USERNAME` - FTP user
- `FTP_PASSWORD` - FTP password
- `FTP_PATH` - Remote directory (e.g., `/public_html/mrwhite/`)

Push to `main` to auto-deploy.
