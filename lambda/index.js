// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const { DynamoDbPersistenceAdapter } = require('ask-sdk-dynamodb-persistence-adapter');
const dynamoDbPersistenceAdapter = new DynamoDbPersistenceAdapter({ tableName : 'ActivityMonitor' })

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes()
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('WELCOME_MESSAGE'))
            .reprompt(requestAttributes.t('WELCOME_MESSAGE'))
            .getResponse();
    }
};

const HelloIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes()
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('HELLO_MESSAGE'))
            .reprompt(requestAttributes.t('HELLO_MESSAGE'))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
        const slotValues = getSlotValues(filledSlots);
        console.log(slotValues)

        return handlerInput.responseBuilder
            .speak('Getting you help with:' + slotValues.helpTopic.resolved)
            .reprompt(requestAttributes.t['HELP_REPROMPT'])
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('STOP_MESSAGE'))
            .getResponse();
    }
};

// Add clean up logic before session ends
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        console.log(`Error stack: ${error.stack}`);
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        return handlerInput.responseBuilder
            .speak(requestAttributes.t('ERROR_MESSAGE'))
            .reprompt(requestAttributes.t('ERROR_MESSAGE'))
            .getResponse();
    }
};

/*
Intercept the incoming requests to include localization
 */
const LocalizationInterceptor = {
    process(handlerInput) {
        // Gets the locale from the request and initializes i18next.
        const localizationClient = i18n.init({
            lng: handlerInput.requestEnvelope.request.locale,
            resources: languageStrings,
            returnObjects: true
        });
        // Creates a localize function to support arguments.
        localizationClient.localize = function localize() {
            // gets arguments through and passes them to
            // i18next using sprintf to replace string placeholders
            // with arguments.
            const args = arguments;
            const value = i18n.t(...args);
            // If an array is used then a random value is selected
            if (Array.isArray(value)) {
                return value[Math.floor(Math.random() * value.length)];
            }
            return value;
        };
        // this gets the request attributes and save the localize function inside
        // it to be used in a handler by calling requestAttributes.t(STRING_ID, [args...])
        const attributes = handlerInput.attributesManager.getRequestAttributes();
        attributes.t = function translate(...args) {
            return localizationClient.localize(...args);
        }
    }
};


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addRequestInterceptors(LocalizationInterceptor)
    .addErrorHandlers(ErrorHandler)
    .lambda();

const enHelpData = {
    ADD_ACTIVITY: 'To add an activity, just say it out.' +
                  'For example, "I am  watering  my plants" or "I fed my dog".',
    LATEST_ACTIVITY_OCCURRENCE: 'To know when you last performed an activity, ' +
                                'just say "When did I water my plants?" or ' +
                                '"When is the last time I fed my dog?".',
    ACTIVITY_COUNT: 'To know the frequency or count of an activity, say ' +
                    '"number of times I watered the plants this week" or ' +
                    '"count of feeding dog today"',
    LIST_ACTIVITIES: 'To list your completed activities for today, say "List my activities for today" or' +
                     '"list all activities this week" or "todays activities"',
    DELETE_ACTIVITY: 'To delete the last occurrence of an activity, say "Delete watering plants activity" or ' +
                     'Delete activity feeding dog',
    LIST_OPTIONS: 'You can say "Add Activity" or "Last Occurrence" or "Activity Count" or "List Activities" or "Delete Activity"',
    NEED_HELP: 'To know more about my features, say "need help"'
}
const enData = {
    translation: {
        SKILL_NAME: 'Activity Monitor',
        WELCOME_MESSAGE: 'Hi. Welcome.' + enHelpData['ADD_ACTIVITY'] + enHelpData['NEED_HELP'],
        HELLO_MESSAGE: 'Hi there! How can I help you?' + enHelpData['ADD_ACTIVITY'] + enHelpData['NEED_HELP'],
        FULL_HELP_MESSAGE: enHelpData['ADD_ACTIVITY'] + enHelpData['LATEST_ACTIVITY_OCCURRENCE'] + enHelpData['ACTIVITY_COUNT'],
        HELP_REPROMPT: 'What can I help you with?' + enHelpData['LIST_OPTIONS'],
        FALLBACK_MESSAGE: 'Sorry can\'t help you with that.' + enHelpData['ADD_ACTIVITY'],
        FALLBACK_REPROMPT: 'What can I help you with?',
        ERROR_MESSAGE: 'Sorry, an error occurred. Say "help me" for assistance',
        STOP_MESSAGE: 'Goodbye! Stay positive and Happy!'
    },
};

// constructs i18n and l10n data structure
const languageStrings = {
    'en-US': enData,
    'en': enData
};
