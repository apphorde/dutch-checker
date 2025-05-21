import { signal, effect } from "@li3/reactive";
import { onDestroy } from "@li3/web";
import aiDutchGrammar from "https://aifn.run/fn/f87db9da-dbe7-4f40-b874-18b76b64c827.js";
import aiFeedback from "https://aifn.run/fn/c4a13509-1700-4da9-8b48-c936328f8d38.js";
import dutchSuggestion from "https://aifn.run/fn/1be3cd02-19b5-41a9-948d-e41cbb819a42.js";
import askMeAnything from "https://aifn.run/fn/d00e526a-0ecb-45b6-8ed0-7afa9afccb06.js";
import translateText from "https://aifn.run/fn/228e48d5-7188-4529-bfc6-8430b4ecf8a0.js";
import questions from "@/questions.js";

function factory() {
  const text = signal("");
  const checking = signal(false);
  const feedback = signal("");
  const feedbackLoading = signal(false);
  const feedbackOpen = signal(false);
  const results = signal("");
  const translation = signal("");
  const history = signal(JSON.parse(localStorage.getItem("history") || "[]"));
  const suggestions = signal(null);
  const thinking = signal(false);

  effect(async () => {
    const input = text.value;
    const correction = results.value;

    suggestions.value =
      input && correction ? await Diff.diffWords(input, correction) : null;
  });

  const correct = effect(() => {
    const input = text.value;
    const ai = results.value.trim();

    return (
      input &&
      ai &&
      (ai === input || ai.replace(/\W+/g, "").toLowerCase() === "correct")
    );
  });

  effect(() => {
    localStorage.setItem("history", JSON.stringify(history.value));
  });

  // reset when text changes
  effect(() => {
    if (!text.value) {
      results.value = "";
      suggestions.value = null;
      feedback.value = "";
      feedbackOpen.value = false;
    }
  });

  function setText(newText) {
    text.value = newText;
  }

  async function suggestAnswer() {
    const lastMessage = history.value.at(-1);
    const question = lastMessage?.contents;

    if (lastMessage?.role !== "assistant" || !question) {
      return;
    }

    thinking.value = true;
    const suggestion = await dutchSuggestion({ text: question });
    thinking.value = false;

    if (suggestion) {
      history.value = [
        ...history.value,
        { role: "user", contents: suggestion },
      ];
      setText(suggestion);
      suggestions.value = null;
    }
  }

  async function newQuestion() {
    const used = history.value.map((h) => h.contents);
    const unused = questions.filter((q) => !used.includes(q));
    const next = !unused.length
      ? ""
      : unused.at(
          Math.floor(unused.length * 100 * Math.random()) % unused.length
        );

    if (next) {
      history.value = [...history.value, { role: "assistant", contents: next }];
      return;
    }

    thinking.value = true;
    const aiNext = await askMeAnything();
    history.value = [...history.value, { role: "assistant", contents: aiNext }];
    thinking.value = false;
  }

  function addToHistory() {
    const v = text.value;

    if (!v) return;

    if (!history.value.find((h) => h.contents === v)) {
      history.value = [...history.value, { role: "user", contents: v }];
      suggestions.value = null;
    }
  }

  function removeMessage(message) {
    history.value = history.value.filter(
      (m) => m.contents !== message.contents
    );
  }

  async function checkGrammar() {
    const source = text.value.trim();

    if (!source) {
      return;
    }

    checking.value = true;
    feedbackOpen.value = true;
    results.value = "";
    results.value = await aiDutchGrammar({ text: source });
    checking.value = false;
  }

  async function askFeedback() {
    feedbackLoading.value = true;
    feedback.value = await aiFeedback({ text: text.value });
    feedbackLoading.value = false;
  }

  async function toggleFeedback() {
    feedbackOpen.value = !text.value ? false : !feedbackOpen.value;
  }

  async function translate() {
    const source = text.value.trim();

    if (!source) {
      return;
    }

    checking.value = true;
    translation.value = "";
    translation.value = await translateText({
      text: source,
      language: "nl",
      target: "en",
    });
    checking.value = false;
  }

  const state = {
    text,
    checking,
    correct,
    results,
    feedback,
    feedbackOpen,
    feedbackLoading,
    history,
    suggestions,
    thinking,
    translation,
  };

  const methods = {
    setText,
    translate,
    checkGrammar,
    askFeedback,
    toggleFeedback,
    addToHistory,
    newQuestion,
    removeMessage,
    suggestAnswer,
  };

  return { state, methods };
}

function createStore(name, factory) {
  const storeKey = `$store$${name}`;
  const { state, methods } = factory();
  const stored = JSON.parse(localStorage.getItem(storeKey) || "{}");
  const readonlyState = {};

  const save = () =>
    localStorage.setItem(storeKey, JSON.stringify(readonlyState));

  for (const k of Object.keys(state)) {
    state[k].watch(save);
    Object.defineProperty(readonlyState, k, {
      enumerable: true,
      configurable: false,
      get() {
        return state[k].value;
      },
    });
  }

  for (const k of Object.keys(stored)) {
    if (state[k] && !state[k].readonly) {
      state[k].value = stored[k];
    }
  }

  return { methods, state: readonlyState };
}

function useStore(store) {
  const effects = [];
  const { state, methods } = store;

  onDestroy(function () {
    for (const f of effects) f.dispose();
  });

  function select(f) {
    const $ = effect(() => f(state));
    effects.push($);
    return $;
  }

  return { store: methods, select };
}

const store = createStore("main", factory);

export default function () {
  return useStore(store);
}
