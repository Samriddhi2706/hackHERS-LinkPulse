
.helper-text {
  margin-top: 10px;
  color: #77758b;
  font-size: 12px;
}

.create-form input {
  background: #fff;
  color: #27213a;
}

.link-tools {
  display: flex;
  gap: 12px;
  margin-bottom: 18px;
}

.link-tools input,
.link-tools select {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #dedbea;
  border-radius: 10px;
  background: #fff;
  color: #27213a;
}

.link-tools input {
  flex: 1;
}

.link-tools select {
  width: 160px;
}

.qr-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 12px;
}

.qr-image {
  width: 90px;
  height: 90px;
  object-fit: contain;
  border: 1px solid #e9e6f3;
  border-radius: 8px;
}

.qr-container a {
  color: #5a40cf;
}

.link-actions .delete-button {
  background: #fff0ed;
  color: #b74737;
}

@media (max-width: 650px) {
  .link-tools {
    flex-direction: column;
  }

  .link-tools select {
    width: 100%;
  }

  .link-actions {
    flex-wrap: wrap;
  }

  .qr-container {
    flex-wrap: wrap;
  }
}
