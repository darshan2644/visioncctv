# 📐 VisionCCTV Diagrams

This directory contains draw.io diagram files that visually represent the VisionCCTV system architecture, data flows, and component relationships.

## 📁 Available Diagrams

### 1. **System Architecture**
📄 [`system-architecture.drawio`](system-architecture.drawio)

**Description**: Comprehensive overview of the VisionCCTV system architecture showing all layers and components.

**Layers Included**:
- **Client Layer**: Web Browser → Next.js Frontend → FastAPI Backend
- **Backend Layer**: Authentication, Video Management, Reference Management, Search Engine, Export System
- **AI Pipeline Layer**: Face Detection (YOLOv8), Face Recognition (FaceNet), Keyword Search (CLIP), Frame Processing (OpenCV)
- **Storage Layer**: File Storage, Metadata Database
- **Export Layer**: PDF Generator (ReportLab), Video Clip Extractor (FFmpeg), Frame Annotator (OpenCV)

**Color Coding**:
- 🟢 Green: Client components
- 🟡 Yellow: Backend services
- 🟣 Purple: AI pipeline components
- 🔵 Blue: Storage components
- 🟩 Light Green: Export components

### 2. **Data Flow Diagram**
📄 [`data-flow.drawio`](data-flow.drawio)

**Description**: Visual representation of the end-to-end data flow through the VisionCCTV system.

**Process Steps**:
1. **Upload Video**: User uploads video through web interface
2. **Process Frames**: AI pipeline processes video frames
3. **Store Results**: Results saved to storage system
4. **Generate Export**: System creates forensic reports and clips
5. **Download Results**: User downloads final results

**Components**: User → Web Browser → Next.js Frontend → FastAPI Backend → AI Pipeline → Storage → Export System → User

### 3. **Face Recognition Pipeline**
📄 [`face-recognition-pipeline.drawio`](face-recognition-pipeline.drawio)

**Description**: Detailed flow of the face recognition process using YOLOv8 and FaceNet.

**Pipeline Steps**:
1. **Upload Video**: Input video file
2. **Frame Extraction**: Extract frames from video
3. **YOLOv8 Face Detection**: Detect faces in each frame
4. **Face Cropping**: Extract face regions
5. **FaceNet Embedding**: Generate face embeddings
6. **Similarity Comparison**: Compare with reference embeddings
7. **Threshold Filtering**: Apply confidence thresholds
8. **Result Generation**: Produce final matches

**Technologies**: YOLOv8, FaceNet, OpenCV

### 4. **Keyword Search Pipeline**
📄 [`keyword-search-pipeline.drawio`](keyword-search-pipeline.drawio)

**Description**: Detailed flow of the keyword-based search process using CLIP.

**Pipeline Steps**:
1. **Upload Video**: Input video file
2. **Frame Extraction**: Extract frames from video
3. **CLIP Image Embedding**: Generate image embeddings
4. **Text Query Embedding**: Generate text query embedding
5. **Similarity Computation**: Compute similarities
6. **Ranking & Filtering**: Rank results by similarity
7. **Result Generation**: Produce final matches

**Technologies**: OpenAI CLIP, PyTorch

### 5. **Docker Architecture**
📄 [`docker-architecture.drawio`](docker-architecture.drawio)

**Description**: Containerized deployment architecture showing component organization.

**Container Components**:
- **FastAPI Backend**: Main application server
- **Next.js Frontend**: Web interface
- **AI Models**: YOLOv8, FaceNet, CLIP models
- **Storage Volume**: Persistent storage for uploads and results
- **Nginx Proxy**: Reverse proxy for production deployment

**External Connections**:
- **User**: Accesses system through web browser
- **External Storage**: Optional cloud storage integration

**Configuration Details**:
- **Port**: 8000 (exposed)
- **Volume**: `/app/backend/storage` (persistent)
- **Network**: Bridge networking

## 🎨 Diagram Features

### Visual Elements
- **Shapes**: Rectangles, ellipses, cylinders for different component types
- **Colors**: Color-coded by component category
- **Labels**: Clear component names and descriptions
- **Connections**: Arrows showing data flow direction
- **Annotations**: Additional information and specifications

### Technical Details
- **Format**: draw.io (XML) - compatible with diagrams.net
- **Resolution**: Optimized for 1200x600 pixels
- **Grid**: 10px grid for precise alignment
- **Style**: Modern, clean, professional appearance

## 🚀 How to Use These Diagrams

### Viewing Options

1. **Online Editor**:
   - Upload to [app.diagrams.net](https://app.diagrams.net/)
   - Drag and drop the `.drawio` file

2. **Desktop Application**:
   - Open with draw.io desktop app
   - Available for Windows, Mac, Linux

3. **VS Code Extension**:
   - Install draw.io extension
   - Open diagrams directly in VS Code

### Editing Guidelines

1. **Consistency**: Maintain color coding and style
2. **Clarity**: Keep labels concise and descriptive
3. **Accuracy**: Ensure diagrams match current implementation
4. **Versioning**: Update diagrams with code changes

### Export Options

From draw.io, you can export to:
- **PNG/SVG**: For documentation and presentations
- **PDF**: For printable documentation
- **HTML**: For web embedding
- **PlantUML**: For text-based diagram generation

## 📚 Diagram Usage in Documentation

### Integration Examples

```markdown
![System Architecture](../diagrams/system-architecture.png)

```

```html
<iframe src="system-architecture.html" width="100%" height="600"></iframe>
```

### Best Practices

1. **Keep Updated**: Update diagrams when architecture changes
2. **Reference in Docs**: Link diagrams in relevant documentation sections
3. **Version Control**: Commit diagram files with code changes
4. **Review**: Include diagrams in code reviews
5. **Export**: Generate PNG versions for GitHub README

## 🔧 Technical Notes

### File Format
- **XML-based**: Standard draw.io format
- **Compressed**: False (human-readable)
- **Compatible**: Works with all draw.io versions

### Diagram Specifications

| Diagram | Size | Components | Complexity |
|---------|------|-------------|------------|
| System Architecture | 1200x800 | 20+ components | High |
| Data Flow | 1200x600 | 10 components | Medium |
| Face Recognition | 1200x400 | 8 steps | Medium |
| Keyword Search | 1200x400 | 7 steps | Medium |
| Docker Architecture | 1200x600 | 8 components | Medium |

### Maintenance

- **Review Cycle**: Quarterly diagram review
- **Update Trigger**: Architecture changes, new features
- **Validation**: Verify against implementation
- **Backup**: Include in documentation backups

## 📞 Support

For diagram-related issues:
- **GitHub Issues**: Report diagram errors or omissions
- **Pull Requests**: Submit diagram improvements
- **Documentation**: Update diagram references in docs

These diagrams provide comprehensive visual documentation of the VisionCCTV system, enhancing understanding and communication among developers, architects, and stakeholders.