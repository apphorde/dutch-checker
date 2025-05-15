import { signal, effect } from "@li3/reactive";
import { onDestroy } from "@li3/web";
import aiDutchGrammar from "https://aifn.run/fn/f87db9da-dbe7-4f40-b874-18b76b64c827.js";
import aiFeedback from "https://aifn.run/fn/c4a13509-1700-4da9-8b48-c936328f8d38.js";
import dutchSuggestion from "https://aifn.run/fn/1be3cd02-19b5-41a9-948d-e41cbb819a42.js";
import questions from "@/questions.js";

function factory() {
  const text = signal("");
  const checking = signal(false);
  const feedback = signal("");
  const feedbackLoading = signal(false);
  const feedbackOpen = signal(false);
  const results = signal("");
  const history = signal(JSON.parse(localStorage.getItem("history") || "[]"));
  const suggestions = signal(null);

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

  function setText(newText) {
    text.value = newText;
  }

  async function suggestAnswer() {
    const lastMessage = history.value.at(-1);
    const question = lastMessage?.contents;

    if (!lastMessage?.role !== "assistant" || !question) {
      return;
    }

    const suggestion = await dutchSuggestion({ text: question });

    if (suggestion) {
      history.value = [
        ...history.value,
        { role: "user", contents: suggestion },
      ];
      setText(suggestion);
    }
  }

  function newQuestion() {
    const used = history.value.map((h) => h.contents);
    const next = questions.find((q) => !used.includes(q));

    if (next) {
      history.value = [...history.value, { role: "assistant", contents: next }];
    }
  }

  function addToHistory() {
    const v = text.value;
    if (!history.value.find((h) => h.contents === v)) {
      history.value = [...history.value, { role: "user", contents: v }];
    }
  }

  function removeMessage(message) {
    history.value = history.value.filter((m) => m !== message);
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
    feedbackOpen.value = !feedbackOpen.value;
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
  };

  const methods = {
    setText,
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

function createStore(factory) {
  const { state, methods } = factory();
  const stateView = {};

  for (const k of Object.keys(state)) {
    Object.defineProperty(stateView, k, {
      get() {
        return state[k].value;
      },
      set(v) {
        state[k].value = v;
      },
    });
  }

  return { methods, state: stateView };
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

const store = createStore(factory);

export default function () {
  return useStore(store);
}
