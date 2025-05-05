
// Define the header component
class HeaderComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <header class="w-full py-4 border-b border-gray-200 bg-white shadow-sm">
        <div class="container max-w-4xl mx-auto px-4 flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-700 to-orange-400"></div>
            <h1 class="text-2xl font-bold">
              <span class="text-blue-700">Dutch</span><span class="text-orange-400">Checker</span>
            </h1>
          </div>
          <div>
            <p class="text-sm text-gray-500">Grammar Check Tool</p>
          </div>
        </div>
      </header>
    `;
  }
}

// Define the footer component
class FooterComponent extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
      <footer class="w-full py-4 border-t border-gray-200 bg-white mt-auto">
        <div class="container max-w-4xl mx-auto px-4">
          <div class="flex flex-col sm:flex-row justify-between items-center">
            <p class="text-sm text-gray-500">
              © ${new Date().getFullYear()} DutchChecker
            </p>
            <p class="text-sm text-gray-500 mt-2 sm:mt-0">
              Check your Dutch grammar instantly
            </p>
          </div>
        </div>
      </footer>
    `;
  }
}

// Define the grammar form component
class GrammarForm extends HTMLElement {
  constructor() {
    super();
    this._isLoading = false;
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    this.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <form id="grammar-form" class="space-y-4">
          <div>
            <label for="sentence" class="block text-sm font-medium text-gray-700 mb-1">Enter Dutch sentence</label>
            <textarea
              id="sentence"
              name="sentence"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type or paste your Dutch sentence here..."
            ></textarea>
          </div>
          <div class="flex justify-end">
            <button
              type="submit"
              id="check-button"
              class="px-6 py-2 bg-blue-700 text-white font-medium rounded-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              ${this._isLoading ? 'disabled' : ''}
            >
              ${this._isLoading ? 
                `<span class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </span>` 
                : 'Check Grammar'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  addEventListeners() {
    const form = this.querySelector('#grammar-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sentenceInput = this.querySelector('#sentence');
      const sentence = sentenceInput.value.trim();
      
      if (!sentence) {
        alert('Please enter a Dutch sentence.');
        return;
      }

      this._isLoading = true;
      this.render();
      
      // Simulate API call delay with setTimeout
      setTimeout(() => {
        this.checkGrammar(sentence);
      }, 1500);
    });
  }

  checkGrammar(sentence) {
    // This is where you would call your actual API
    // For now, we'll simulate a response with mock data
    const mockResponse = {
      original: sentence,
      isCorrect: Math.random() > 0.5, // Randomly determine if correct
      suggestions: [],
      errors: []
    };

    // If not correct, generate some mock errors and suggestions
    if (!mockResponse.isCorrect) {
      const mockErrors = [
        { type: 'spelling', text: sentence.split(' ')[0], position: { start: 0, end: sentence.split(' ')[0].length } },
        { type: 'grammar', text: sentence.split(' ')[1], position: { start: sentence.split(' ')[0].length + 1, end: sentence.split(' ')[0].length + 1 + sentence.split(' ')[1].length } }
      ];
      
      mockResponse.errors = mockErrors;
      mockResponse.suggestions = [
        'Corrected version of the sentence would go here.',
        'Alternative correction could go here.'
      ];
    }

    // Dispatch custom event with the results
    const event = new CustomEvent('grammar-checked', { 
      detail: mockResponse,
      bubbles: true 
    });
    this.dispatchEvent(event);
    
    this._isLoading = false;
    this.render();
  }
}

// Define the results display component
class ResultsDisplay extends HTMLElement {
  constructor() {
    super();
    this._results = null;
  }

  connectedCallback() {
    this.render();
    document.addEventListener('grammar-checked', (e) => {
      this._results = e.detail;
      this.render();
    });
  }

  render() {
    if (!this._results) {
      this.innerHTML = ``;
      return;
    }

    const { original, isCorrect, suggestions, errors } = this._results;

    let html = `
      <div class="bg-white rounded-lg shadow-md p-6 mt-4">
        <h3 class="text-xl font-semibold mb-4">Grammar Check Results</h3>
    `;

    if (isCorrect) {
      html += `
        <div class="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
          <div class="flex items-start">
            <svg class="h-6 w-6 text-green-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p class="text-green-800 font-medium">No grammar errors found!</p>
              <p class="text-green-700 text-sm mt-1">Your Dutch sentence appears to be grammatically correct.</p>
            </div>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
          <div class="flex items-start">
            <svg class="h-6 w-6 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <p class="text-red-800 font-medium">Grammar issues detected</p>
              <p class="text-red-700 text-sm mt-1">We found ${errors.length} issues in your Dutch sentence.</p>
            </div>
          </div>
        </div>
      `;

      // Display original text with highlighted errors
      html += `<div class="mb-4">
        <h4 class="font-medium text-gray-700 mb-2">Original sentence:</h4>
        <p class="p-3 bg-gray-50 rounded border border-gray-200">`;
      
      const words = original.split(' ');
      words.forEach((word, index) => {
        const error = errors.find(e => e.text === word);
        if (error) {
          if (error.type === 'spelling') {
            html += `<span class="bg-red-100 text-red-800 px-1 rounded">${word}</span>`;
          } else {
            html += `<span class="bg-orange-100 text-orange-800 px-1 rounded">${word}</span>`;
          }
        } else {
          html += word;
        }
        
        if (index < words.length - 1) {
          html += ' ';
        }
      });
      
      html += `</p></div>`;

      // Display suggestions
      if (suggestions.length > 0) {
        html += `
          <div class="mb-4">
            <h4 class="font-medium text-gray-700 mb-2">Suggestions:</h4>
            <ul class="list-disc pl-5 space-y-1">
        `;
        
        suggestions.forEach(suggestion => {
          html += `<li class="text-gray-800">${suggestion}</li>`;
        });
        
        html += `</ul></div>`;
      }
    }

    html += `</div>`;
    this.innerHTML = html;
  }
}

// Register custom elements
customElements.define('header-component', HeaderComponent);
customElements.define('footer-component', FooterComponent);
customElements.define('grammar-form', GrammarForm);
customElements.define('results-display', ResultsDisplay);
