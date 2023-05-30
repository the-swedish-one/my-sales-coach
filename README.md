# My Sales Coach

This app helps you practice your sales skills in different pre-set scenarios.

## Setup

### Dependencies

- Run `npm install` in project directory. This will install server-related dependencies such as `express`.
- `cd client` and run:
  `npm install`
  This will install client dependencies (React, ChatGPT, Google Cloud Text-to-Speech, and React Speech Recognition and Tailwind CSS).

### API Prep

You will need 2 of your own API keys for this code to run:

- Chat GPT API - You can [create your own profile](https://openai.com/blog/openai-api) and grab your API KEY And put it into a _front-end_ .env file.
- Google Cloud Text to Speech API - For this one you will need a [Google Cloud Developers account](https://cloud.google.com/) and then you will need to enable the Text to Speech API and make a service account for your project. Use this [tutorial](https://www.youtube.com/watch?v=HSuwhalBGx0) and just follow the instructions for adding the service account details to a service_account.json file and linking it with your _back-end_ .env file.

_Note_: Don't forget to gitignore both your .env files and your service_account.json before pushing to github so that you don't share your G Cloud service account details!

### Development

- Run `npm start` in project directory to start the Express server on port 4000
- In another terminal, `cd client` and run `npm run dev` to start the client in development mode with hot reloading in port 5173.

_This is a student project that was created at [CodeOp](http://codeop.tech), a full stack development bootcamp in Barcelona._
