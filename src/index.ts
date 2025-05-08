class State {
  accepting: boolean;
  transitionMap: Map<string, Array<State>>;

  constructor({ accepting = false }) {
    this.accepting = accepting;
    this.transitionMap = new Map<string, Array<State>>();
  }

  addTransitionForSymbol(symbol: string, state: State): void {
    const transitions = this.transitionMap.get(symbol) ?? [];
    this.transitionMap.set(symbol, [...transitions, state]);
  }

  getTransitionsForSymbol(symbol: string): Array<State> {
    return this.transitionMap.get(symbol) ?? [];
  }

  test(input: string): boolean {
    return input.length > 0;
  }
}

class NFA {
  constructor(
    public inState: State,
    public outState: State,
  ) {}

  test(input: string): boolean {
    return this.inState.test(input);
  }
}

// #region basic machines

export function char(symbol: string): NFA {
  const inState = new State({ accepting: false });
  const outState = new State({ accepting: true });

  inState.addTransitionForSymbol(symbol, outState);

  return new NFA(inState, outState);
}

export const EPSILON = 'ϵ';

export function epsilon(): NFA {
  return char(EPSILON);
}

function createInitStates() {
  const inState = new State({ accepting: false });
  const outState = new State({ accepting: true });

  return { inState, outState };
}

/* ----------------------------- Basic compound ----------------------------- */

export function concatPair(first: NFA, second: NFA): NFA {
  first.outState.accepting = false;
  second.outState.accepting = true;

  first.outState.addTransitionForSymbol(EPSILON, second.inState);

  return new NFA(first.inState, second.outState);
}

export function concat(first: NFA, ...rest: NFA[]): NFA {
  return rest.reduce(concatPair, first);
}

export function orPair(first: NFA, second: NFA): NFA {
  first.outState.accepting = false;
  second.outState.accepting = false;

  const { inState, outState } = createInitStates();

  inState.addTransitionForSymbol(EPSILON, first.inState);
  inState.addTransitionForSymbol(EPSILON, second.inState);

  first.outState.addTransitionForSymbol(EPSILON, inState);
  second.outState.addTransitionForSymbol(EPSILON, inState);

  return new NFA(inState, outState);
}

export function or(first: NFA, ...rest: NFA[]): NFA {
  return rest.reduce(orPair, first);
}

export function rep(fragment: NFA): NFA {
  // const inState = new State({ accepting: false });
  // const outState = new State({ accepting: true });

  // fragment.outState.accepting = false;

  // inState.addTransitionForSymbol(EPSILON, fragment.inState);
  // inState.addTransitionForSymbol(EPSILON, outState);

  // fragment.outState.addTransitionForSymbol(EPSILON, outState);
  // outState.addTransitionForSymbol(EPSILON, fragment.inState);

  // return new NFA(inState, outState);
  fragment.inState.addTransitionForSymbol(EPSILON, fragment.outState);
  fragment.outState.addTransitionForSymbol(EPSILON, fragment.inState);

  return fragment;
}

// #endregion

export function plusRep(fragment: NFA): NFA {
  fragment.outState.addTransitionForSymbol(EPSILON, fragment.inState);

  return fragment;
}

export function questionRep(fragment: NFA): NFA {
  fragment.inState.addTransitionForSymbol(EPSILON, fragment.outState);

  return fragment;
}
