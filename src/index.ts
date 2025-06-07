/**
 * Класс State представляет состояние в недетерминированном конечном автомате (NFA).
 * Каждое состояние может быть финальным или не финальным и содержит переходы по символам.
 */
class State {
  /** Флаг, указывающий, является ли состояние финальным */
  accepting: boolean;
  /** Карта переходов: символ -> массив состояний, в которые можно перейти */
  transitionMap: Map<string, Array<State>>;

  /**
   * Конструктор состояния
   * @param accepting - является ли состояние финальным (по умолчанию false)
   */
  constructor({ accepting = false }) {
    this.accepting = accepting;
    this.transitionMap = new Map<string, Array<State>>();
  }

  /**
   * Добавляет переход из текущего состояния в другое состояние по заданному символу
   * @param symbol - символ, по которому происходит переход
   * @param state - целевое состояние
   */
  addTransitionForSymbol(symbol: string, state: State): void {
    const transitions = this.transitionMap.get(symbol) ?? [];
    this.transitionMap.set(symbol, [...transitions, state]);
  }

  /**
   * Возвращает все состояния, в которые можно перейти по заданному символу
   * @param symbol - символ для поиска переходов
   * @returns массив состояний
   */
  getTransitionsForSymbol(symbol: string): Array<State> {
    return this.transitionMap.get(symbol) ?? [];
  }

  /**
   * Проверяет, принимает ли автомат заданную строку, начиная с текущего состояния
   * @param input - входная строка для проверки
   * @param visited - множество уже посещенных состояний (для предотвращения циклов)
   * @returns true, если строка принимается автоматом
   */
  test(input: string, visited = new Set()): boolean {
    // Предотвращаем бесконечные циклы при epsilon-переходах
    if (visited.has(this)) {
      return false;
    }

    visited.add(this);

    // Если входная строка пуста
    if (input.length === 0) {
      // Если текущее состояние финальное, строка принимается
      if (this.accepting) {
        return true;
      }

      // Проверяем epsilon-переходы (переходы без потребления символов)
      for (const nextState of this.getTransitionsForSymbol(EPSILON)) {
        if (nextState.test('', visited)) {
          return true;
        }
      }

      return false;
    }

    // Берем первый символ и остаток строки
    const symbol = input[0];
    const rest = input.slice(1);

    // Получаем все переходы по текущему символу
    const symbolTransitions = this.getTransitionsForSymbol(symbol);

    // Проверяем каждый переход по символу
    for (const nextState of symbolTransitions) {
      if (nextState.test(rest)) {
        return true;
      }
    }

    // Проверяем epsilon-переходы (не потребляя текущий символ)
    for (const nextState of this.getTransitionsForSymbol(EPSILON)) {
      if (nextState.test(input, visited)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Класс NFA представляет недетерминированный конечный автомат.
 * Автомат имеет начальное и конечное состояния.
 */
class NFA {
  /**
   * Конструктор NFA
   * @param inState - начальное состояние автомата
   * @param outState - конечное состояние автомата
   */
  constructor(
    public inState: State,
    public outState: State,
  ) {}

  /**
   * Проверяет, принимает ли автомат заданную строку
   * @param input - входная строка для проверки
   * @returns true, если строка принимается автоматом
   */
  test(input: string): boolean {
    return this.inState.test(input);
  }
}

// #region Базовые автоматы

/**
 * Создает NFA, который принимает только один заданный символ
 * @param symbol - символ, который должен принимать автомат
 * @returns NFA, принимающий только указанный символ
 */
export function char(symbol: string): NFA {
  const inState = new State({ accepting: false });
  const outState = new State({ accepting: true });

  inState.addTransitionForSymbol(symbol, outState);

  return new NFA(inState, outState);
}

/** Символ epsilon (пустой переход) */
export const EPSILON = 'ϵ';

/**
 * Создает NFA с epsilon-переходом (принимает пустую строку)
 * @returns NFA, принимающий пустую строку
 */
export function epsilon(): NFA {
  return char(EPSILON);
}

/**
 * Вспомогательная функция для создания начального и конечного состояний
 * @returns объект с начальным и конечным состояниями
 */
function createInitStates() {
  const inState = new State({ accepting: false });
  const outState = new State({ accepting: true });

  return { inState, outState };
}

/* ----------------------------- Составные операции ----------------------------- */

/**
 * Создает конкатенацию двух NFA (последовательное выполнение)
 * Результирующий автомат принимает строки вида: строки_первого_автомата + строки_второго_автомата
 * @param first - первый автомат
 * @param second - второй автомат
 * @returns NFA, представляющий конкатенацию
 */
export function concatPair(first: NFA, second: NFA): NFA {
  first.outState.accepting = false;
  second.outState.accepting = true;

  // Соединяем конечное состояние первого автомата с начальным состоянием второго
  first.outState.addTransitionForSymbol(EPSILON, second.inState);

  return new NFA(first.inState, second.outState);
}

/**
 * Создает конкатенацию нескольких NFA
 * @param first - первый автомат
 * @param rest - остальные автоматы
 * @returns NFA, представляющий конкатенацию всех автоматов
 */
export function concat(first: NFA, ...rest: NFA[]): NFA {
  return rest.reduce(concatPair, first);
}

/**
 * Создает дизъюнкцию (ИЛИ) двух NFA
 * Результирующий автомат принимает строки, которые принимает любой из исходных автоматов
 * @param first - первый автомат
 * @param second - второй автомат
 * @returns NFA, представляющий дизъюнкцию
 */
export function orPair(first: NFA, second: NFA): NFA {
  first.outState.accepting = false;
  second.outState.accepting = false;

  const { inState, outState } = createInitStates();

  // Из начального состояния можем перейти в любой из двух автоматов
  inState.addTransitionForSymbol(EPSILON, first.inState);
  inState.addTransitionForSymbol(EPSILON, second.inState);

  // Из конечных состояний обоих автоматов переходим в общее конечное состояние
  first.outState.addTransitionForSymbol(EPSILON, outState);
  second.outState.addTransitionForSymbol(EPSILON, outState);

  return new NFA(inState, outState);
}

/**
 * Создает дизъюнкцию нескольких NFA
 * @param first - первый автомат
 * @param rest - остальные автоматы
 * @returns NFA, представляющий дизъюнкцию всех автоматов
 */
export function or(first: NFA, ...rest: NFA[]): NFA {
  return rest.reduce(orPair, first);
}

/**
 * Создает замыкание Клини (звездочка *) - ноль или более повторений
 * Результирующий автомат принимает пустую строку и любое количество повторений исходного фрагмента
 * @param fragment - автомат для повторения
 * @returns NFA, представляющий замыкание Клини
 */
export function rep(fragment: NFA): NFA {
  // Можем сразу перейти к концу (принять пустую строку)
  fragment.inState.addTransitionForSymbol(EPSILON, fragment.outState);
  // Можем повторить фрагмент еще раз
  fragment.outState.addTransitionForSymbol(EPSILON, fragment.inState);

  return fragment;
}

// #endregion

/**
 * Создает положительное замыкание (плюс +) - одно или более повторений
 * Результирующий автомат принимает одно или более повторений исходного фрагмента
 * @param fragment - автомат для повторения
 * @returns NFA, представляющий положительное замыкание
 */
export function plusRep(fragment: NFA): NFA {
  // Можем повторить фрагмент еще раз после завершения
  fragment.outState.addTransitionForSymbol(EPSILON, fragment.inState);

  return fragment;
}

/**
 * Создает опциональный квантификатор (вопрос ?) - ноль или одно вхождение
 * Результирующий автомат принимает пустую строку или одно вхождение исходного фрагмента
 * @param fragment - автомат для опционального выполнения
 * @returns NFA, представляющий опциональный квантификатор
 */
export function questionRep(fragment: NFA): NFA {
  // Можем сразу перейти к концу (пропустить фрагмент)
  fragment.inState.addTransitionForSymbol(EPSILON, fragment.outState);

  return fragment;
}
