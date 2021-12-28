module.exports.default = function (req, res) {
  return res.send(JSON.stringify({
    '@context': '/contexts/ComponentCollection',
    '@id': '/_/component_collections/cc76794e-ead1-4c18-949b-6740bc8cd623',
    '@type': 'ComponentCollection',
    reference: 'home_primary',
    location: 'primary',
    layouts: [],
    pages: ['/_/pages/1d2c947a-8726-4dc7-8f24-655f45e91f68'],
    components: [],
    componentPositions: [
      '/_/component_positions/bcec8679-3a54-4baa-b485-d2579f1687f5'
    ],
    createdAt: '2020-06-24T08:14:52+00:00',
    modifiedAt: '2020-06-24T08:14:52+00:00',
    _metadata: { persisted: true }
  }))
}
