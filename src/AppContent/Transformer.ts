import * as ts from 'typescript';

const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
   const visit: ts.Visitor = (node) => {
      if (ts.isTypeAliasDeclaration(node) && ts.isIntersectionTypeNode(node.type)) {
         if (node.type.types.find(node => ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.escapedText === 'GenerateRecords')) {

         }
      }
      return ts.visitEachChild(node, (child) => visit(child), context);
   };

   return ((node) => ts.visitNode(node, visit)) as ts.Transformer<ts.SourceFile>;
};

export default transformer;