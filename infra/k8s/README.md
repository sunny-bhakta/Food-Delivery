# Kubernetes manifests 
Store helm charts or raw manifests per service here.
## Example: Deploy catalog-service with a Kubernetes Deployment and Service

You can create raw Kubernetes manifests for any service here.

Below is a sample deployment and service manifest for the `catalog-service` (Node.js example):

<details>
<summary>catalog-service-deployment.yaml</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog-service
spec:
  replicas: 1
  selector:
    matchLabels:
      app: catalog-service
  template:
    metadata:
      labels:
        app: catalog-service
    spec:
      containers:
        - name: catalog-service
          image: your-dockerhub-username/catalog-service:latest
          ports:
            - containerPort: 4001
          env:
            - name: PORT
              value: "4001"
```
</details>

<details>
<summary>catalog-service-service.yaml</summary>

```yaml
apiVersion: v1
kind: Service
metadata:
  name: catalog-service
spec:
  selector:
    app: catalog-service
  ports:
    - protocol: TCP
      port: 4001
      targetPort: 4001
  type: ClusterIP
```
</details>

