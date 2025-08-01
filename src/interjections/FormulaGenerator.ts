import type { IStore } from "@/helpers/TaskGraphUtility";
import type { IFormulaGenerator } from "@/interfaces/interjectionInterfaces/formulaGeneratorInterface";
import nerdamer from 'nerdamer/all.min.js';
import { parse } from 'mathjs';
const mathlex = window.MathLex;

// const syntaxTree = mathlex.parse("z = sum(v_i/w_i^p,i)/sum(1/w_i^p ,i)");

// Interfaces
type AbstractSyntaxTree = [string, AbstractSyntaxTree, AbstractSyntaxTree];
interface IParsedTree {
  [key: string]: IParsedTree | any;
}
interface IVariableTable {
  [variable: string]: Array<number> | number;
}
interface IExpressionHandler {
  [key: string]: Function;
}

// TODO restructure without relying on global variable
var decimals = 2;
const roundValue = (value: any) => parseFloat(parseFloat(value as unknown as string).toFixed(decimals));

const formulaGenerator = (
  storeObject: IStore,
  dependencies: IFormulaGenerator["dependencies"],
  component_id: string = "0"
) => {
  const { getProperty, setProperty } = storeObject;
  const currentNode = getProperty(`currentNode`);

  decimals = getProperty(dependencies.decimals);
  const formula = getProperty(dependencies.formula) || "";
  const texFormula = getProperty(dependencies.texFormula) || "";
  const variableTable: IVariableTable = Object.entries(getProperty(dependencies.variables)).reduce(
    (variableTable, [variableName, variablePath]) => {
      variableTable[variableName] = getProperty(variablePath);
      return variableTable;
    },
    {}
  );


  
  //const tex = nerdamer(test);
  //const tex = mathlex.parse(texFormula);
  //const latex= mathlex.render(tex, "latex");
  //const test = "(a / (b - c)) + (d * e) + f";
  //const test = "sum(x+y, x, 1, 20)" 
  //const test = "sum(v_i / w_i^2, i, 0, n)";
  //const test = "r = sum(v_i /w_i^2 ,i,0,n) / sum(1/w_i^2 ,i,0,n)";
  //const test  = "r = product(v_i / w_i^2, i, 0, n)" 
  //const test = "r = integrate(10 * x / (4 * x^2 + 24 * x + 20 ), x)";
  //const test  = "factor( x^2 - 3 * x - 10)"
  //const test = "diff(n,t) = (diff(n_0,t) - diff(n_a,t) + V_R * sum( r , j , 0 , n))";
  //const test = "diff(Q,t) = (diff(m,t) * c_p T)_0 + (- Delta_R(H)) * V_R * ( sum(r, j,0,n ) ) + k_w * A * (T_w - T)"
  /*
  let latex = nerdamer.convertToLaTeX(test);
  // Entferne \limits and mathrm komplett
  latex = latex.replace(/\\limits/g, "");
  latex = latex.replace(/\\mathrm/g, "");
  console.log(latex);
  */
  //const abstractSyntaxTree = mathlex.parse(formula);
  const abstractSyntaxTree = mathlex.parse(formula);
  const expr = nerdamer(texFormula);
  const latex = expr.toTeX().replace(/\\limits/g, "");
  //latex  = latex.replace(/\\limits/g, ""); 
  const sage = mathlex.render(abstractSyntaxTree, "sage");
  const ast = ASTParser(abstractSyntaxTree, variableTable);
  const aladin = replaceVariables(ast, variableTable);
  
  setProperty({ path: `nodes__${currentNode}__components__${component_id}__component__tex`, value: latex });
  setProperty({ path: `nodes__${currentNode}__components__${component_id}__component__sage`, value: sage });
  setProperty({ path: `nodes__${currentNode}__components__${component_id}__component__aladinAST`, value: aladin });
  setProperty({ path: `nodes__${currentNode}__components__${component_id}__component__AST`, value: ast });
};

const replaceVariables = (subtree: IParsedTree, variableTable: IVariableTable, index: number = null) => {
  const keys = Object.keys(subtree);
  if (keys.includes("type") && subtree.type === "variable") {
    let value;
    if (subtree.index) {
      value = variableTable[subtree.name][index];
      subtree = [{ type: "scalar", value: roundValue(value), userValue: "", valueType: "variable" }];
    } else {
      value = variableTable[subtree.name];
      subtree = [{ type: "scalar", value: roundValue(value), userValue: "", valueType: "variableConstant" }];
    }
  }
  const extractNested = (keys: Array<string>): IParsedTree | null => {
    const nestedKeys = ["slots", "terms", "rightTerm", "leftTerm"];
    for (let key of keys) {
      if (nestedKeys.includes(key)) return subtree[key];
    }
    return null;
  };

  // const nested = keys.includes("slots") ? subtree["slots"] : subtree["terms"];
  const nested = extractNested(keys);
  if (nested) {
    for (let i = 0; i < nested.length; i++) {
      const nestedTree = nested[i];
      let replacedTree = replaceVariables(nestedTree, variableTable, index);
      if (Array.isArray(replacedTree)) replacedTree = replacedTree[0];
      nested[i] = replacedTree;
    }
  }
  return subtree;
};

// ExpressionHandlers
const negativeHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  // TODO: handle case when Negative wraps non-scalar
  return [
    {
      type: "scalar",
      value: `(- ${roundValue(leftSubtree)})`,
      datatype: rightSubtree,
      userValue: "",
      valueType: "constant"
    }
  ];
};
const exponentHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  return [
    {
      type: "power",
      slots: [
        { name: "base", terms: leftSubtree },
        { name: "exponent", terms: rightSubtree }
      ]
    }
  ];
};
const equationHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  return {
    leftTerm: leftSubtree,
    comparisonOperator: operator,
    rightTerm: rightSubtree
  };
};
const fractionHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  return [
    {
      type: "fraction",
      slots: [
        { name: "numerator", terms: leftSubtree },
        { name: "denominator", terms: rightSubtree }
      ]
    }
  ];
};
const baseOperationHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  const operatorMap: { [key: string]: string } = {
    Plus: "+",
    Minus: "-",
    Times: "*"
  };
  return [
    {
      type: "BaseOperation",
      options: { operation: operatorMap[operator] },
      slots: [
        { name: "firstOperand", terms: leftSubtree },
        { name: "secondOperand", terms: rightSubtree }
      ]
    }
  ];
};
const subscriptHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  return [{ ...leftSubtree[0], index: rightSubtree[0].name }];
};
const inclusionHandler = (operator: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
  // returns just the Set variable
  return rightSubtree;
};
const functionHandler = (functionType: string, subtrees: Array<IParsedTree>, variableTable: { [key: string]: any }) => {
  const rangeHandler = () => {
    const [operand, indexVariable, startVariable, endVariable] = subtrees;
    const startIndex = startVariable[0].value;
    const endIndex = variableTable[endVariable[0].name];

    const operationTable: { [key: string]: string } = {
      sum: "+",
      product: "*"
      //subscriptHandler  - Symbol
      //derivativeHandler - Symbol
      //deltaHandel - Symbol
    };
    const operation = operationTable[functionType];

    const deepCopy = (obj: any) => JSON.parse(JSON.stringify(obj));

    // Liste aller Operanden
    const terms: any[] = [];

    for (let i = startIndex; i < endIndex; i++) {
      const replacedOperand = replaceVariables(deepCopy(operand[0]), variableTable, i);
      terms.push(replacedOperand);
    }

    // Alle Operanden in eine BaseOperation packen
    return [
      terms.reduce((acc, term) => {
        if (!acc) return term; // erster Operand direkt übernehmen
        return {
          type: "BaseOperation",
          options: { operation },
          slots: [
            { name: "firstOperand", terms: [acc] },
            { name: "secondOperand", terms: [term] }
          ]
        };
      }, null)
    ];
  };
  
  const rootHandler = () => {
    const [radicand, exponent] = subtrees;
    const parsedRadicand = { name: "radicand", terms: radicand };
    if (exponent && exponent[0] && [0, 1, 2].includes(exponent[0].value)) {
      return [{ type: "radical", slots: [parsedRadicand] }];
    }
    return [
      {
        type: "radical",
        slots: [{ name: "index", terms: exponent }, parsedRadicand]
      }
    ];
  };

  const functionMap: { [key: string]: Function } = {
    sum: rangeHandler,
    product: rangeHandler,
    root: rootHandler,
    sqrt: rootHandler
    //subscriptHandler :  es ist vorhanden aber muss noch getestet ob es reibungslos funktioniert
    //derivativeHandler : es muss entwickelt (für Ableitungen)
    //deltaHandel : es muss entwickelt (aber zuerst mal fragen, ob die Formel soll durch andere Formel ersetzt werden)
  };

  return functionMap[functionType]();
};
const expressionHandler: IExpressionHandler = {
  Equal: (operation: string, leftSubtree: IParsedTree, rightSubtree: IParsedTree) => {
    const operationTable: { [key: string]: string } = {
      Equal: "=",
      Less: "<",
      Greater: ">",
      LessEqual: "<=",
      GreaterEqual: ">=",
      Unequal: "!="
    };
    return equationHandler(operationTable[operation], leftSubtree, rightSubtree);
  },
  Plus: baseOperationHandler,
  Minus: baseOperationHandler,
  Times: baseOperationHandler,
  Divide: fractionHandler,
  Exponent: exponentHandler,
  Negative: negativeHandler,
  Subscript: subscriptHandler,
  Inclusion: inclusionHandler
};

const ASTParser = (abstractSyntaxTree: AbstractSyntaxTree, variableTable: IVariableTable): IParsedTree => {
  let [operation, operand1, operand2] = abstractSyntaxTree;

  if (typeof operand1 === "string") {
    if (operation === "Literal") {
      return [{ type: "scalar", value: roundValue(operand2), datatype: operand1, userValue: "", valueType: "constant" }];
    }
    if (operation === "Variable") return [{ type: "variable", name: operand1 }];
  }
  if (operation === "Function") {
    // force type conversions in case of Function, see example ->
    //  [
    //     'Function',
    //     [ 'Variable', 'root' ],
    //     [ [ 'Literal', 'Int', 2 ], [ 'Literal', 'Int', 5 ] ]
    //   ]
    const functionType: string = operand1[1] as unknown as string;
    const operands = operand2.map((term) => ASTParser(term as unknown as AbstractSyntaxTree, variableTable));

    return functionHandler(functionType, operands, variableTable);
  }
  const leftSubtree = ASTParser(operand1, variableTable);
  const rightSubtree = ASTParser(operand2, variableTable);
  return expressionHandler[operation](operation, leftSubtree, rightSubtree);
};

export { formulaGenerator as formulaGenerator, mathlex };
