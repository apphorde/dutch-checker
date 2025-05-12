// import { createStore } from "@li3/store";
import { signal, effect } from "@li3/reactive";
import { onDestroy } from "@li3/web";
import aiDutchGrammar from "https://aifn.run/fn/f87db9da-dbe7-4f40-b874-18b76b64c827.js";
import aiFeedback from "https://aifn.run/fn/c4a13509-1700-4da9-8b48-c936328f8d38.js";

function factory() {
  const text = signal("");
  const checking = signal(false);
  const feedback = signal("");
  const feedbackLoading = signal(false);
  const feedbackOpen = signal(false);
  const results = signal("");

  const correct = effect(
    () =>
      results.value.trim() === text.value ||
      results.value.trim().replace(/\W+/g, "").toLowerCase() === "correct"
  );

  function setText(newText) {
    text.value = newText;
  }

  async function checkGrammar() {
    const source = text.value.trim();

    if (!source) {
      return;
    }

    checking.value = true;
    feedbackOpen.value = true;
    results.value = await aiDutchGrammar({ text: source });
    // results.value = await new Promise((s) =>
    //   setTimeout(() => s("zij is fijn nus"), 1000)
    // );
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
  };

  const methods = {
    setText,
    checkGrammar,
    askFeedback,
    toggleFeedback,
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
