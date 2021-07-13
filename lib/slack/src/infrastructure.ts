import fetch from 'node-fetch'

// todo: think about error handling as well
async function fetchManager(userName: String): Promise<String> {
  const hr_response = await fetch(
    `http://localhost:${process.env.DAPR_HTTP_PORT}/v1.0/invoke/hr.hr/method/graphql`,
    {
      body: JSON.stringify({
        query: managerQuery,
        variables: { userId: userName },
      }),
      method: 'POST',
    }
  )

  const hr_body = await hr_response.json()

  return hr_body.data.human.manager.name
  //return 'cedd'
}

const managerQuery = `query ManagerOf($userId: String!){
    human(id: $userId) {
      id
      name
      manager {
        id
        name
      }
    }
  }`

export { fetchManager }
