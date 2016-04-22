function saveWeights(path, weights, colHeaders)
%SAVEWEIGHTS Saves the weights to an xml file at the given path
%   Weights is a (p+1) X m matrix, where p is the number of features and
%       m is the number of outputs. The extra row is for a DC coefficient
%       (bias weight)

docNode = com.mathworks.xml.XMLUtils.createDocument('weights');
for i = 1:size(weights, 2)
    dim = docNode.createElement(colHeaders(i));
    for j = 1:size(weights, 1)
        weightNode = dim.appendChild(docNode.createElement('weight'));
        weight = sprintf('%f', weights(j, i));
        weightNode.appendChild(docNode.createTextNode(weight));
    end
    docNode.getDocumentElement.appendChild(dim);
end

xmlwrite(path, docNode);

end

