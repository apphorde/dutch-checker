// import { createStore } from "@li3/store";
import { signal, effect } from "@li3/reactive";
import { onDestroy } from "@li3/web";
import aiDutchGrammar from "https://aifn.run/fn/f87db9da-dbe7-4f40-b874-18b76b64c827.js";
import aiFeedback from "https://aifn.run/fn/c4a13509-1700-4da9-8b48-c936328f8d38.js";
import questions from "@/questions.js";

function factory() {
  const text = signal("");
  const checking = signal(false);
  const feedback = signal("");
  const feedbackLoading = signal(false);
  const feedbackOpen = signal(false);
  const results = signal("");
  const history = signal(JSON.parse(localStorage.getItem("history") || "[]"));

  const correct = effect(
    () =>
      results.value.trim() === text.value ||
      results.value.trim().replace(/\W+/g, "").toLowerCase() === "correct"
  );

  effect(() => {
    localStorage.setItem("history", JSON.stringify(history.value));
  });

  function setText(newText) {
    text.value = newText;
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
  };

  const methods = {
    setText,
    checkGrammar,
    askFeedback,
    toggleFeedback,
    addToHistory,
    newQuestion,
    removeMessage,
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
