import React from 'react'

export const dumpObject = (obj) => (
  <code>
    <pre>
      {Object.entries(obj).map(([key, value]) => `${key}: ${(value)}\n`)}
    </pre>
  </code>
)
